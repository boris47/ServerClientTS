
import * as http from 'http';
import * as fs from 'fs';
import * as zlib from 'zlib';

import * as ComUtils from '../../../../Common/Utils/ComUtils';
import { IClientRequestResult } from '../../../../Common/Interfaces';
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
	private static HandleCompression(response: http.IncomingMessage, resolve: (value: IClientRequestResult) => void) : http.IncomingMessage | zlib.Unzip
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
	private static HandleDownload(response: http.IncomingMessage, clientRequestInternalOptions: IClientRequestInternalOptions, resolve: (value: IClientRequestResult) => void )
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
				const result = Buffer.from('ClientRequests:ServetToClient: Data received correcly');
				ComUtils.ResolveWithGoodResult(result, resolve);
			});
		}
		else
		{
			const buffers = new Array<Buffer>();
			let contentLength = 0;
			compressonHandledResponse.on('error', (err: Error) =>
			{
				clientRequestInternalOptions.ComFlowManager?.Progress.SetProgress(-1, 1);
				ComUtils.ResolveWithError('ClientRequests:ServetToClient:[ResponseError]', `${ err.name }:${ err.message }`, resolve);
			});
			compressonHandledResponse.on('data', function(chunk: Buffer)
			{
				contentLength += chunk.length;
				buffers.push(chunk);

			});
			compressonHandledResponse.on('end', function()
			{
				const result: Buffer = Buffer.concat(buffers, contentLength);
				ComUtils.ResolveWithGoodResult(result, resolve);
			});
		}
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	private static HandleUpload(request: http.ClientRequest, clientRequestInternalOptions: IClientRequestInternalOptions)
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
					//	console.log( "ClientRequestsProcessing.Request_PUT:data: ", totalLength, currentLength, currentLength / totalLength );
				});
			}
		}
		else// direct value sent
		{
			request.end(clientRequestInternalOptions.Value);
		}
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	/** Server -> Client */
	public static async MakeRequest(options: http.RequestOptions, clientRequestInternalOptions: IClientRequestInternalOptions): Promise<IClientRequestResult>
	{
		return new Promise<IClientRequestResult>((resolve) =>
		{
			options.headers = clientRequestInternalOptions.Headers;

			const request: http.ClientRequest = http.request(options);
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
				const statusCode: number = response.statusCode || 200;
				if (statusCode !== 200)
				{
					ComUtils.ResolveWithError('ClientRequests:ServetToClient:[StatusCode]', `${ response.statusCode }:${ response.statusMessage }`, resolve);
					return;
				}
				ClientRequestsProcessing.HandleDownload(response, clientRequestInternalOptions, resolve )
			});
			ClientRequestsProcessing.HandleUpload(request, clientRequestInternalOptions);
		});
	}
}