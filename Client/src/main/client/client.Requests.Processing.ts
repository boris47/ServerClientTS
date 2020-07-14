
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
	private static zlibOptions: zlib.ZlibOptions =
	{
		flush: zlib.constants.Z_SYNC_FLUSH,
		finishFlush: zlib.constants.Z_SYNC_FLUSH
	};

	/////////////////////////////////////////////////////////////////////////////////////////
	/** Server -> Client */
	public static async MakeRequest( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) : Promise<IClientRequestResult>
	{
		return new Promise<IClientRequestResult>( (resolve) =>
		{
			if ( clientRequestInternalOptions.Storage )
			{
				const requestPath = new URLSearchParams();
				requestPath.set( 'stg', clientRequestInternalOptions.Storage );
				!clientRequestInternalOptions.Key || requestPath.set( 'key', clientRequestInternalOptions.Key );
				options.path += '?' + requestPath.toString();
			}

			const request : http.ClientRequest = http.request( options );

			// Set headers
			if ( clientRequestInternalOptions.Headers )
			{
				for( const [key, value] of Object.entries(clientRequestInternalOptions.Headers) )
				{
					request.setHeader( key, value );
				}
			}
			
			request.on( 'response', ( response: http.IncomingMessage ) : void =>
			{
				const statusCode : number = response.statusCode || 200;
				if ( statusCode !== 200 )
				{
					ComUtils.ResolveWithError( 'ClientRequests:ServetToClient:[StatusCode]', `${response.statusCode}:${response.statusMessage}`, resolve );
					return;
				}

			//	response.on( 'error', ( err : Error ) =>
			//	{
			//		ComUtils.ResolveWithError( 'ClientRequests:ServetToClient:[ResponseError]', `${err.name}:${err.message}`, resolve );
			//	});
				
				let stream : ( zlib.Unzip | http.IncomingMessage ) = response;
				switch ( response.headers['content-encoding']?.trim().toLowerCase() )
				{
					case 'gzip': case 'compress':
					{
						stream = response.pipe( zlib.createGunzip( ClientRequestsProcessing.zlibOptions ) );
						break;
					}
					case 'deflate':
					{
						stream = response.pipe( zlib.createInflate( ClientRequestsProcessing.zlibOptions ) );
						break;
					}
				}

				stream.on( 'error', ( err : Error ) =>
				{
					ComUtils.ResolveWithError( 'ClientRequests:ServetToClient:[ResponseError]', `${err.name}:${err.message}`, resolve );
				});
				
				const totalLength : number = Number( response.headers['content-length'] );
				if ( clientRequestInternalOptions.WriteStream )
				{
					stream.pipe( clientRequestInternalOptions.WriteStream );
					
					let currentLength : number = 0;
					stream.on( 'data', ( chunk: Buffer ) =>
					{
						currentLength += chunk.length;
						clientRequestInternalOptions.ComFlowManager?.Progress.SetProgress( totalLength, currentLength );
					//	console.log( "ClientRequestsProcessing.ServetToClient:data: ", totalLength, currentLength, progress );
					});
					
					stream.on( 'end', () =>
					{
						const result = Buffer.from( 'ClientRequests:ServetToClient: Data received correcly' );
						ComUtils.ResolveWithGoodResult( result, resolve );
					})
				}
				else
				{
					const buffers = new Array<Buffer>();
					let contentLength = 0;
					stream.on( 'error', ( err : Error ) =>
					{
						clientRequestInternalOptions.ComFlowManager?.Progress.SetProgress( -1, 1 );
						ComUtils.ResolveWithError( 'ClientRequests:ServetToClient:[ResponseError]', `${err.name}:${err.message}`, resolve );
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

			request.on( 'close', function()
			{
				ComUtils.ResolveWithGoodResult( Buffer.from( "Done" ), resolve );
			});

			request.on('timeout', () =>
			{
				request.abort();
				ComUtils.ResolveWithError( 'ClientRequests:ServetToClient:[TIMEOUT]', `Request for path ${options.path}`, resolve );
			});

			request.on('error', function( err : Error )
			{
				clientRequestInternalOptions.WriteStream?.close();
				clientRequestInternalOptions.ReadStream?.unpipe();
				clientRequestInternalOptions.ReadStream?.close();
				clientRequestInternalOptions.ComFlowManager?.Progress.SetProgress( -1, 1 );
				ComUtils.ResolveWithError( 'ClientRequests:ServetToClient:[RequestError]', `${err.name}:${err.message}`, resolve );
			});

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
						clientRequestInternalOptions.ComFlowManager?.Progress.SetProgress( totalLength, currentLength );
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


	/////////////////////////////////////////////////////////////////////////////////////////
	/** Client -> Server */
	public static async ClientToServer2( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) : Promise<IClientRequestResult>
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
					ComUtils.ResolveWithError( "ClientRequests:ClientToServer:[StatusCode]", `${response.statusCode}:${response.statusMessage}`, resolve );
					return;
				}
			});

			request.on('timeout', () =>
			{
				request.abort();
				ComUtils.ResolveWithError( 'ClientRequests:ClientToServer:[TIMEOUT]', `Request for path ${options.path}`, resolve );
			});

			request.on( 'close', function()
			{
				ComUtils.ResolveWithGoodResult( Buffer.from( "Done" ), resolve );
			});
			
			request.on('error', function( err : Error )
			{
				clientRequestInternalOptions.ReadStream?.unpipe();
				clientRequestInternalOptions.ReadStream?.close();
				clientRequestInternalOptions.ComFlowManager?.Progress.SetProgress( -1, 1 );
				ComUtils.ResolveWithError( "ClientRequests:ClientToServer:[RequestError]", `${err.name}:${err.message}`, resolve );
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
						clientRequestInternalOptions.ComFlowManager?.Progress.SetProgress( totalLength, currentLength );
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