
import * as http from 'http';
import * as followRedirects from 'follow-redirects';
import * as fs from 'fs';
import * as zlib from 'zlib';

import * as ComUtils from '../../../../Common/Utils/ComUtils';
import { ComFlowManager } from '../../../../Common/Utils/ComUtils';



export interface IClientRequestInternalOptions
{
	DownloadLocation?: string;
	Value?: string | Buffer;
	Headers?: http.IncomingHttpHeaders;
	ReadStream?: fs.ReadStream;
	WriteStream?: fs.WriteStream;
	ComFlowManager?: ComFlowManager | undefined;
}


export class ClientRequestsProcessing
{
	private static zlibOptions: zlib.ZlibOptions =
	{
		flush: zlib.constants.Z_SYNC_FLUSH,
		finishFlush: zlib.constants.Z_SYNC_FLUSH
	};


	/////////////////////////////////////////////////////////////////////////////////////////
	private static HandleCompression(response: http.IncomingMessage, resolve: (value: Buffer | Error) => void) : http.IncomingMessage | zlib.Unzip
	{
		let stream: (zlib.Unzip | http.IncomingMessage) = response;
		switch (response.headers['content-encoding']?.trim().toLowerCase())
		{
			case 'gzip': case 'compress':
			{
				stream = response.pipe(zlib.createGunzip(ClientRequestsProcessing.zlibOptions));
				break;
			}
			case 'deflate':
			{
				stream = response.pipe(zlib.createInflate(ClientRequestsProcessing.zlibOptions));
				break;
			}
		}

		stream.on('error', (err: Error) =>
		{
			ComUtils.ResolveWithError('ClientRequests:ServetToClient:[ResponseError]', `${ err.name }:${ err.message }`, resolve);
		});
		return stream;
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	private static HandleDownload(response: http.IncomingMessage, clientRequestInternalOptions: IClientRequestInternalOptions, resolve: (value: Buffer | Error) => void ): void
	{
		const compressonHandledResponse = ClientRequestsProcessing.HandleCompression(response, resolve);
		const contentLength: number = Number(response.headers['content-length']);
		if (clientRequestInternalOptions.WriteStream)
		{
			compressonHandledResponse.pipe(clientRequestInternalOptions.WriteStream);

			let currentLength: number = 0;
			compressonHandledResponse.on('data', (chunk: Buffer) =>
			{
				currentLength += chunk.length;
				clientRequestInternalOptions.ComFlowManager?.Progress.SetProgress(contentLength, currentLength);
				//	console.log( "ClientRequestsProcessing.ServetToClient:data: ", contentLength, currentLength, progress );
			});

			compressonHandledResponse.on('end', () =>
			{
				const result: Buffer = Buffer.from('ClientRequests:ServetToClient: Data received correcly');
				ComUtils.ResolveWithGoodResult(result, resolve);
			});
		}
		else
		{
			const buffers = new Array<Buffer>();// ...(response.statusMessage ? [Buffer.from(response.statusMessage)] : [undefined] ) );
			let contentLength = 0;//response.statusMessage?.length || 0;
			compressonHandledResponse.on('error', (err: Error) =>
			{
				clientRequestInternalOptions.ComFlowManager?.Progress.SetProgress(-1, 1);
				ComUtils.ResolveWithError('ClientRequests:ServetToClient:[ResponseError]', `${ err.name }:${ err.message }`, resolve);
			});
			compressonHandledResponse.on('data', (chunk: Buffer) =>
			{
				contentLength += chunk.length;
				buffers.push(chunk);
			});
			compressonHandledResponse.on('end', () =>
			{
				const result: Buffer = Buffer.concat(buffers, contentLength);
				ComUtils.ResolveWithGoodResult(result, resolve);
			});
		}
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	private static HandleUpload(request: followRedirects.RedirectableRequest<http.ClientRequest, http.IncomingMessage>, clientRequestInternalOptions: IClientRequestInternalOptions): void
	{
		// If upload of file is requested
		if (clientRequestInternalOptions.ReadStream)
		{
			clientRequestInternalOptions.ReadStream.pipe(request);
			if (clientRequestInternalOptions.Headers['content-length'])
			{
				let currentLength: number = 0;
				const totalLength: number = Number(clientRequestInternalOptions.Headers['content-length']);
				clientRequestInternalOptions.ReadStream.on('data', (chunk: Buffer) =>
				{
					currentLength += chunk.length;
					clientRequestInternalOptions.ComFlowManager?.Progress.SetProgress(totalLength, currentLength);
				//	console.log( "ClientRequestsProcessing.Request_PUT:data: ", clientRequestInternalOptions.ComFlowManager.Tag, totalLength, currentLength, currentLength / totalLength );
				});
			}
		}
		else// direct value sent
		{
			request.end(clientRequestInternalOptions.Value);
		}
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public static async MakeRequest(options: http.RequestOptions, clientRequestInternalOptions: IClientRequestInternalOptions): Promise<Buffer | Error>
	{
		return new Promise<Buffer | Error>((resolve) =>
		{
			options.headers = clientRequestInternalOptions.Headers;

			const finalOptions : followRedirects.FollowOptions<http.RequestOptions> =
			{
				followRedirects: true,
				maxRedirects: 21, // default
				maxBodyLength: 2 * 1024 * 1024 * 1024, // 2GB
		//		beforeRedirect: ( options: http.RequestOptions & followRedirects.FollowOptions<http.RequestOptions>, responseDetails: followRedirects.ResponseDetails ) =>
		//		{
		//			if (false)
		//			{
		//				throw Error("no errors");
		//			}
		//		}
			}

			const request: followRedirects.RedirectableRequest<http.ClientRequest, http.IncomingMessage> = followRedirects.http.request(Object.assign(options, finalOptions));

//			const request: http.ClientRequest = http.request(options);
			request.on('close', function()
			{
				ComUtils.ResolveWithGoodResult(Buffer.from("Done"), resolve);
			});

			request.on('timeout', () =>
			{
				request.abort();
				ComUtils.ResolveWithError('ClientRequests:ServetToClient:[TIMEOUT]', `Request for path ${ options.path }`, resolve);
			});

			request.on('error', function(err: Error)
			{
				clientRequestInternalOptions.WriteStream?.close();
				clientRequestInternalOptions.ReadStream?.unpipe();
				clientRequestInternalOptions.ReadStream?.close();
				clientRequestInternalOptions.ComFlowManager?.Progress.SetProgress(-1, 1);
				ComUtils.ResolveWithError('ClientRequests:ServetToClient:[RequestError]', `${ err.name }:${ err.message }`, resolve);
			});

			request.on('response', (response: http.IncomingMessage): void =>
			{
				const statusCode: number = response.statusCode;
				if (statusCode !== 200)
				{
					ComUtils.ResolveWithError('ClientRequests:ServetToClient:[StatusCode]', `${ statusCode }:${ response.statusMessage }`, resolve);
					return;
				}
				ClientRequestsProcessing.HandleDownload(response, clientRequestInternalOptions, resolve )
			});
			ClientRequestsProcessing.HandleUpload(request, clientRequestInternalOptions);
		});
	}
}