
import * as http from 'http';
import * as fs from 'fs';
import * as zlib from 'zlib';

import * as ComUtils from '../../../../Common/Utils/ComUtils';
import { IClientRequestResult } from '../../../../Common/Interfaces';
import { ComFlowManager } from '../../../../Common/Utils/ComUtils';



export interface IClientRequestInternalOptions
{
	Identifier? : string;
	DownloadLocation?: string;
	Storage?: string;
	Key? : string;
	Value? : any;
	Headers? : http.IncomingHttpHeaders;
	ReadStream? : fs.ReadStream;
	WriteStream? : fs.WriteStream;
	ComFlowManager?: ComFlowManager | undefined;
}


export class ClientRequestsProcessing
{
	/////////////////////////////////////////////////////////////////////////////////////////
	/** Server -> Client */
	public static async Request_GET( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) : Promise<IClientRequestResult>
	{
		return new Promise<IClientRequestResult>( (resolve) =>
		{
			if ( clientRequestInternalOptions.Storage )
			{
				const path = new URLSearchParams();
				path.set( 'stg', clientRequestInternalOptions.Storage );
				!clientRequestInternalOptions.Key || path.set( 'key', clientRequestInternalOptions.Key );
				options.path += '?' + path.toString();
			}

			const request : http.ClientRequest = http.request( options );
			request.on( 'response', ( response: http.IncomingMessage ) : void =>
			{
				const statusCode : number = response.statusCode || 200;
				if ( statusCode !== 200 )
				{
					ComUtils.ResolveWithError( 'ClientRequests:Request_GET:[StatusCode]', `${response.statusCode}:${response.statusMessage}`, resolve );
					return;
				}

				response.on( 'error', ( err : Error ) =>
				{
					ComUtils.ResolveWithError( 'ClientRequests:Request_GET:[ResponseError]', `${err.name}:${err.message}`, resolve );
				});

				const zlibOptions = <zlib.ZlibOptions>
				{
					flush: zlib.constants.Z_SYNC_FLUSH,
					finishFlush: zlib.constants.Z_SYNC_FLUSH
				};
				
				let stream : ( zlib.Unzip | http.IncomingMessage ) = response;
				switch ( response.headers['content-encoding']?.trim().toLowerCase() )
				{
					case 'gzip': case 'compress':
					{
						stream = response.pipe( zlib.createGunzip( zlibOptions ) );
						break;
					}
					case 'deflate':
					{
						stream = response.pipe( zlib.createInflate( zlibOptions ) );
						break;
					}
				}

				stream.on( 'error', ( err : Error ) =>
				{
					ComUtils.ResolveWithError( 'ClientRequests:Request_GET:[ResponseError]', `${err.name}:${err.message}`, resolve );
				});

				
				if ( clientRequestInternalOptions.WriteStream )
				{
					stream.pipe( clientRequestInternalOptions.WriteStream );
					
					clientRequestInternalOptions.WriteStream.on( 'error', ( err: Error ) =>
					{
						ComUtils.ResolveWithError( 'ClientRequests:Request_GET:[ResponseError]', `${err.name}:${err.message}`, resolve );
					});
					
					let currentLength : number = 0;
					const totalLength : number = Number( response.headers['content-length'] );
					stream.on( 'data', ( chunk: Buffer ) =>
					{
						currentLength += chunk.length;
						clientRequestInternalOptions.ComFlowManager.Progress.SetProgress( totalLength, currentLength );
					//	console.log( "ClientRequestsProcessing.Request_GET:data: ", totalLength, currentLength, progress );
					});
					
					clientRequestInternalOptions.WriteStream.on( 'finish', () =>
					{
						const result = Buffer.from( 'ClientRequests:Request_GET: Data received correcly' );
						ComUtils.ResolveWithGoodResult( result, resolve );
					})
				}
				else
				{
					const buffers = new Array<Buffer>();
					let contentLength = 0;
					stream.on( 'error', ( err : Error ) =>
					{
						clientRequestInternalOptions.ComFlowManager.Progress.SetProgress( -1, 1 );
						ComUtils.ResolveWithError( 'ClientRequests:Request_GET:[ResponseError]', `${err.name}:${err.message}`, resolve );
					});
					stream.on( 'data', function( chunk : Buffer )
					{
						contentLength += chunk.length;
						buffers.push( chunk );
	
					})
					stream.on( 'end', function()
					{
						const result : Buffer = Buffer.concat( buffers, contentLength );
						ComUtils.ResolveWithGoodResult( result, resolve );
					});
				}
			});

			request.on('error', function( err : Error )
			{
				return ComUtils.ResolveWithError( 'ClientRequests:Request_GET:[RequestError]', `${err.name}:${err.message}`, resolve );
			})
			request.end();
		});
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	/** Client -> Server */
	public static async Request_PUT( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) : Promise<IClientRequestResult>
	{
		return new Promise<IClientRequestResult>( (resolve) =>
		{
			if ( clientRequestInternalOptions.Storage && clientRequestInternalOptions.Key )
			{
				const requestPath = new URLSearchParams();
				requestPath.set( 'stg', clientRequestInternalOptions.Storage );
				requestPath.set( 'key', clientRequestInternalOptions.Key );
				options.path += '?' + requestPath.toString();
			}
			
			const request : http.ClientRequest = http.request( options );
			request.on( 'response', ( response: http.IncomingMessage ) : void =>
			{
				const statusCode : number = response.statusCode || 200;
				if ( statusCode !== 200 )
				{
					ComUtils.ResolveWithError( "ClientRequests:Request_PUT:[StatusCode]", `${response.statusCode}:${response.statusMessage}`, resolve );
					return;
				}
			});

			request.on( 'close', function()
			{
				ComUtils.ResolveWithGoodResult( Buffer.from( "Done" ), resolve );
			});
			
			request.on('error', function( err : Error )
			{
				clientRequestInternalOptions.ReadStream?.unpipe();
				clientRequestInternalOptions.ReadStream?.close();
				clientRequestInternalOptions.ComFlowManager.Progress.SetProgress( -1, 1 );
				ComUtils.ResolveWithError( "ClientRequests:Request_PUT:[RequestError]", `${err.name}:${err.message}`, resolve );
			});

			// Set headers
			if ( clientRequestInternalOptions.Headers )
			{
				for( const [key, value] of Object.entries(clientRequestInternalOptions.Headers) )
				{
					request.setHeader( key, value );
				}
			}
			
			// If upload of file is requested
			if ( clientRequestInternalOptions.ReadStream )
			{
				clientRequestInternalOptions.ReadStream.pipe( request );
				if ( clientRequestInternalOptions.Headers['content-length'] )
				{
					let currentLength : number = 0;
					const totalLength : number = Number( clientRequestInternalOptions.Headers['content-length'] );
					clientRequestInternalOptions.ReadStream.on( 'data', ( chunk: Buffer ) =>
					{
						currentLength += chunk.length;
						clientRequestInternalOptions.ComFlowManager.Progress.SetProgress( totalLength, currentLength );
					//	console.log( "ClientRequestsProcessing.Request_PUT:data: ", totalLength, currentLength, currentLength / totalLength );
					});
				}
			}
			else // direct value sent
			{
				request.end( clientRequestInternalOptions.Value );
			}
		});
	}
}