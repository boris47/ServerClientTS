
import * as http from 'http';
import * as followRedirects from 'follow-redirects';
import * as stream from 'stream';
import * as zlib from 'zlib';

import * as ComUtils from '../../../../Common/Utils/ComUtils';
import { ComFlowManager } from '../../../../Common/Utils/ComUtils';



export interface IClientRequestInternalOptions
{
	DownloadLocation?: string;
	Value?: string | Buffer;
	Headers?: http.IncomingHttpHeaders;
	ReadStream?: stream.Readable;
	WriteStream?: stream.Writable;
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
	/** Server -> Client */
	public static HandleDownload(options: http.RequestOptions, clientRequestInternalOptions: IClientRequestInternalOptions ): Promise<Buffer | Error>
	{
		return new Promise<Buffer | Error>( resolve =>
		{
			const request = ClientRequestsProcessing.MakeRequest(options, clientRequestInternalOptions, resolve);
			request.on('response', (response: http.IncomingMessage): void =>
			{
				if (response.statusCode >= 400)
				{
					const errMessage = `${response.statusCode}:${response.statusMessage}`;
					ComUtils.ResolveWithError( 'ClientRequestsProcessing:HandleDownload:[StatusCode]', errMessage, resolve );
					return;
				}

				const compressonHandledResponse = ClientRequestsProcessing.HandleCompression(response, resolve);
				const buffers = new Array<Buffer>();
				const contentLength: number = parseInt(response.headers['content-length'], 10);
				let currentLength = 0;
				if (clientRequestInternalOptions.WriteStream)
				{
					compressonHandledResponse.pipe(clientRequestInternalOptions.WriteStream);
	
					let currentReachedLength: number = 0;
					compressonHandledResponse.on('data', (chunk: Buffer) =>
					{
						currentReachedLength += chunk.length;
						clientRequestInternalOptions.ComFlowManager?.Progress.SetProgress(contentLength, currentReachedLength);
					//	console.log( "ClientRequestsProcessing.ServetToClient:data: ", contentLength, currentLength, progress );
					});

					clientRequestInternalOptions.WriteStream.on( 'finish', () =>
					{
						const result = Buffer.from( 'ClientRequestsProcessing:HandleDownload[WriteStream]: Data received correcly' );
						ComUtils.ResolveWithGoodResult(result, resolve);
					});
				}
				else // normal way
				{
					compressonHandledResponse.on('error', (err: Error) =>
					{
						clientRequestInternalOptions.ComFlowManager?.Progress.SetProgress(-1, 1);
						ComUtils.ResolveWithError('ClientRequests:ServetToClient:[ResponseError]', `${err.name}:${err.message}`, resolve);
					});

					compressonHandledResponse.on('data', (chunk: Buffer) =>
					{
						currentLength += chunk.length;
						buffers.push(chunk);

						if (contentLength < currentLength)
						{
							const errMessage = `Response "${options.path}:${options.method}" data length exceed(${currentLength}) content length(${contentLength})!`;
							ComUtils.ResolveWithError( 'ClientRequests:ServetToClient:[ResponseError]', errMessage, resolve );
						}
					});

					compressonHandledResponse.on('end', () =>
					{
						const result: Buffer = Buffer.concat(buffers, currentLength)
						ComUtils.ResolveWithGoodResult(result, resolve);
					});
				}
			});
			request.end();
		});
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	/** Client -> Server */
	public static HandleUpload(options: http.RequestOptions, clientRequestInternalOptions: IClientRequestInternalOptions): Promise<Buffer | Error>
	{
		return new Promise<Buffer | Error>( resolve =>
		{
			const request = ClientRequestsProcessing.MakeRequest(options, clientRequestInternalOptions, resolve);
			if (clientRequestInternalOptions.ReadStream)
			{
				clientRequestInternalOptions.ReadStream.on( 'error', ( err: Error ) =>
				{
					ComUtils.ResolveWithError( "ClientRequestsProcessing:HandleUpload[ReadStream]", err );
				});
	
				const totalLength: number = parseInt(clientRequestInternalOptions.Headers['content-length'], 10);
				let currentLength: number = 0;
				clientRequestInternalOptions.ReadStream.on( 'data', ( chunk: Buffer ) =>
				{
					currentLength += chunk.length;
					request.write(chunk);
					clientRequestInternalOptions.ComFlowManager?.Progress.SetProgress(totalLength, currentLength);
				//	console.log( "ClientRequestsProcessing.Request_PUT:data: ", clientRequestInternalOptions.ComFlowManager.Tag, totalLength, currentLength, currentLength / totalLength );
				});
	
				clientRequestInternalOptions.ReadStream.on( 'end', () =>
				{
					clientRequestInternalOptions.ReadStream.destroy();
					ComUtils.ResolveWithGoodResult( Buffer.from( 'ClientRequestsProcessing:HandleUpload[ReadStream]: Data sent correcly' ), resolve );
				});
			}

			if (clientRequestInternalOptions.Value !== undefined)
			{
				request.on( 'response', ( response: http.IncomingMessage ) =>
				{
					if (response.statusCode >= 400)
					{
						const errMessage = `${response.statusCode}:${response.statusMessage}`;
						ComUtils.ResolveWithError( 'ClientRequestsProcessing:HandleUpload:[StatusCode]', errMessage, resolve );
						return;
					}
					ComUtils.ResolveWithGoodResult( Buffer.from( 'ClientRequestsProcessing:HandleUpload[Standard]: Data sent correcly' ), resolve );
				});
				request.end(clientRequestInternalOptions.Value);
			}
		});
	}

	/** Server -> Client (No Write Stream) */
	public static SimpleRequest(options: http.RequestOptions, clientRequestInternalOptions: IClientRequestInternalOptions): Promise<Buffer | Error>
	{
		clientRequestInternalOptions.WriteStream?.destroy();
		clientRequestInternalOptions.WriteStream = undefined;
		return ClientRequestsProcessing.HandleDownload(options, clientRequestInternalOptions);
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	private static MakeRequest(options: http.RequestOptions, clientRequestInternalOptions: IClientRequestInternalOptions, resolve: (value: Error | Buffer) => void): followRedirects.RedirectableRequest<http.ClientRequest, http.IncomingMessage>
	{
		options.headers = clientRequestInternalOptions.Headers;

		const followOptions : followRedirects.FollowOptions<http.RequestOptions> =
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
		};
		const requestOptions: (http.RequestOptions & followRedirects.FollowOptions<http.RequestOptions>) = { ...options, ...followOptions };
		const request: followRedirects.RedirectableRequest<http.ClientRequest, http.IncomingMessage> = followRedirects.http.request(requestOptions);
		request.on('timeout', () =>
		{
			request.abort();
			clientRequestInternalOptions.WriteStream?.destroy();
			clientRequestInternalOptions.ReadStream?.unpipe();
			clientRequestInternalOptions.ReadStream?.destroy();
			clientRequestInternalOptions.ComFlowManager?.Progress.SetProgress(-1, 1);
			ComUtils.ResolveWithError('ClientRequests:MakeRequest:[TIMEOUT]', `Request for path ${options.path}`, resolve);
		});

		request.on('error', function(err: Error)
		{
			clientRequestInternalOptions.WriteStream?.destroy();
			clientRequestInternalOptions.ReadStream?.unpipe();
			clientRequestInternalOptions.ReadStream?.destroy();
			clientRequestInternalOptions.ComFlowManager?.Progress.SetProgress(-1, 1);
			ComUtils.ResolveWithError('ClientRequests:MakeRequest:[RequestError]', err, resolve);
		});
		return request;
	}
}