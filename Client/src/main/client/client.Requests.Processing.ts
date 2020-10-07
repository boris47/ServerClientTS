
import * as http from 'http';
import * as net from 'net';
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


	/**  */
	private static ResetClientInternalOptionsToBad(clientRequestInternalOptions: IClientRequestInternalOptions): void
	{
		clientRequestInternalOptions.WriteStream?.removeAllListeners();
		clientRequestInternalOptions.WriteStream?.destroy();
		clientRequestInternalOptions.ReadStream?.removeAllListeners();
		clientRequestInternalOptions.ReadStream?.unpipe();
		clientRequestInternalOptions.ReadStream?.destroy();
		clientRequestInternalOptions.ComFlowManager?.Progress.SetProgress(-1, 1);
		clientRequestInternalOptions.Value = undefined;
	}

	/**  */
	private static HandleCompression(response: http.IncomingMessage) : zlib.Gunzip | zlib.Inflate | http.IncomingMessage
	{
		let stream: (zlib.Gunzip | zlib.Inflate | http.IncomingMessage) = response;
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

	//	stream.on('error', (err: Error) =>
	//	{
	//		ComUtils.ResolveWithError('ClientRequestsProcessing:HandleCompression:[ResponseError]', `${ err.name }:${ err.message }`, resolve);
	//	});
		return stream;
	}


	/** Server -> Client */
	public static async HandleDownload(options: http.RequestOptions, clientRequestInternalOptions: IClientRequestInternalOptions ): Promise<Buffer | Error>
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
					ClientRequestsProcessing.ResetClientInternalOptionsToBad(clientRequestInternalOptions);
					return;
				}

				const compressonHandledResponse = ClientRequestsProcessing.HandleCompression(response);
				const buffers = new Array<Buffer>();
				const contentLength: number = parseInt(response.headers['content-length'], 10);
				let currentLength = 0;
				if (clientRequestInternalOptions.WriteStream)
				{
//					request.on( 'socket', (socket: net.Socket) =>
//					{
//						socket.on('connect', () =>
//						{
							compressonHandledResponse.pipe(clientRequestInternalOptions.WriteStream);
							
							clientRequestInternalOptions.WriteStream.on( 'error', (err: Error) =>
							{
								ComUtils.ResolveWithError('ClientRequestsProcessing:HandleDownload:[WriteStream]', `${err.name}:${err.message}`, resolve);
								ClientRequestsProcessing.ResetClientInternalOptionsToBad(clientRequestInternalOptions);
							});
		
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
//						});
//					});

				}
				else // normal way
				{
					compressonHandledResponse.on('error', (err: Error) =>
					{
						ComUtils.ResolveWithError('ClientRequestsProcessing:HandleDownload:[Standard]', err, resolve);
						ClientRequestsProcessing.ResetClientInternalOptionsToBad(clientRequestInternalOptions);
					});

					compressonHandledResponse.on('data', (chunk: Buffer) =>
					{
						currentLength += chunk.length;
						buffers.push(chunk);

						if (contentLength < currentLength)
						{
							const errMessage = `Response "${options.path}:${options.method}" data length exceed(${currentLength}) content length(${contentLength})!`;
							ComUtils.ResolveWithError( 'ClientRequestsProcessing:HandleDownload:[DataSizeError]', errMessage, resolve );
							ClientRequestsProcessing.ResetClientInternalOptionsToBad(clientRequestInternalOptions);
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


	/** Client -> Server */
	public static async HandleUpload(options: http.RequestOptions, clientRequestInternalOptions: IClientRequestInternalOptions): Promise<Buffer | Error>
	{
		return new Promise<Buffer | Error>( resolve =>
		{
			const request = ClientRequestsProcessing.MakeRequest(options, clientRequestInternalOptions, resolve);
			if (clientRequestInternalOptions.ReadStream)
			{
				clientRequestInternalOptions.ReadStream.on( 'error', ( err: Error ) =>
				{
					ComUtils.ResolveWithError( "ClientRequestsProcessing:HandleUpload[ReadStream]", err , resolve);
					ClientRequestsProcessing.ResetClientInternalOptionsToBad(clientRequestInternalOptions);
				});

				// Read data only if socket is connected
				request.on( 'socket', (socket: net.Socket) =>
				{
					socket.on('connect', () =>
					{
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
							request.end();
							clientRequestInternalOptions.ReadStream.destroy();
							ComUtils.ResolveWithGoodResult( Buffer.from( 'ClientRequestsProcessing:HandleUpload[ReadStream]: Data sent correcly' ), resolve );
						});
					});
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
						ClientRequestsProcessing.ResetClientInternalOptionsToBad(clientRequestInternalOptions);
						return;
					}
					ComUtils.ResolveWithGoodResult( Buffer.from( 'ClientRequestsProcessing:HandleUpload[Standard]: Data sent correcly' ), resolve );
				});
				request.end(clientRequestInternalOptions.Value);
			}
		});
	}


	/** Server -> Client (No Write Stream) */
	public static async SimpleRequest(options: http.RequestOptions, clientRequestInternalOptions: IClientRequestInternalOptions): Promise<Buffer | Error>
	{
//		const ping = await ClientRequestsProcessing.Ping(options, clientRequestInternalOptions);
//		if ( !Buffer.isBuffer(ping) ) return ping;

		clientRequestInternalOptions.WriteStream?.destroy(); // Ensura data will be sent into body
		clientRequestInternalOptions.WriteStream = undefined;
		return ClientRequestsProcessing.HandleDownload(options, clientRequestInternalOptions);
	}


	/** Private */
	private static MakeRequest(options: http.RequestOptions, clientRequestInternalOptions: IClientRequestInternalOptions, resolve: (value: Error | Buffer) => void): http.ClientRequest
	{
		options.headers = clientRequestInternalOptions.Headers;
		
		const followOptions: followRedirects.FollowOptions<http.RequestOptions> =
		{
			followRedirects: true,
			maxRedirects: 21, // default
			maxBodyLength: 2 * 1024 * 1024 * 1024, // 2GB
		//	beforeRedirect: ( options: http.RequestOptions & followRedirects.FollowOptions<http.RequestOptions>, responseDetails: followRedirects.ResponseDetails ) =>
		//	{
		//		if (false)
		//		{
		//			throw Error("no errors");
		//		}
		//	}
		};
		const requestOptions: (http.RequestOptions & followRedirects.FollowOptions<http.RequestOptions>) = { ...options, ...followOptions };
		const request: http.ClientRequest = followRedirects.http.request(requestOptions) as http.ClientRequest;
		request.on('timeout', () =>
		{
			request.destroy();
			ComUtils.ResolveWithError('ClientRequestsProcessing:MakeRequest:[TIMEOUT]', `Request for path ${options.path}`, resolve);
			ClientRequestsProcessing.ResetClientInternalOptionsToBad(clientRequestInternalOptions);
		});

		request.on('error', (err: Error) =>
		{
			ComUtils.ResolveWithError('ClientRequestsProcessing:MakeRequest:[RequestError]', err, resolve);
			ClientRequestsProcessing.ResetClientInternalOptionsToBad(clientRequestInternalOptions);
		});

		request.on( 'abort', () =>
		{
			ComUtils.ResolveWithError('ClientRequestsProcessing:MakeRequest:[ABORT]', `Request for path ${options.path}`, resolve);
			ClientRequestsProcessing.ResetClientInternalOptionsToBad(clientRequestInternalOptions);
		});

		return request;
	}
}