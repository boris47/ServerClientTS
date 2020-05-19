
import * as http from 'http';
import * as zlib from 'zlib';

import * as ComUtils from '../../../../Common/Utils/ComUtils';
import { IClientRequestResult } from '../../../../Common/Interfaces';
import { IClientRequestInternalOptions } from './client.Requests.Mapping';


export class ClientRequestsProcessing
{
	/////////////////////////////////////////////////////////////////////////////////////////
	public static async Request_GET( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions = {} ) : Promise<IClientRequestResult>
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

				let stream : ( zlib.Unzip | http.IncomingMessage ) = response;

				const zlibOptions = <zlib.ZlibOptions>
				{
					flush: zlib.constants.Z_SYNC_FLUSH,
					finishFlush: zlib.constants.Z_SYNC_FLUSH
				};

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

				const buffers = new Array<Buffer>();
				let contentLength = 0;

				stream.on( 'error', ( err : Error ) =>
				{
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
			})

			request.on('error', function( err : Error )
			{
				return ComUtils.ResolveWithError( 'ClientRequests:Request_GET:[RequestError]', `${err.name}:${err.message}`, resolve );
			})
			request.end();
		});
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public static async Request_PUT( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions = {} ) : Promise<IClientRequestResult>
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
				}
			});

			request.on( 'close', function()
			{
				ComUtils.ResolveWithGoodResult( Buffer.from( "Done" ), resolve );
			});
			
			request.on('error', function( err : Error )
			{
				ComUtils.ResolveWithError( "ClientRequests:Request_PUT:[RequestError]", `${err.name}:${err.message}`, resolve );
			});

			// Set headers
			if ( clientRequestInternalOptions.Headers )
			{
				for( const [key, value] of clientRequestInternalOptions.Headers )
				{
					request.setHeader( key, value );
				}
			}

			// If upload of file is requested
			if ( clientRequestInternalOptions.FileStream )
			{
				clientRequestInternalOptions.FileStream.pipe( request );
			}
			else // direct value sent
			{
				request.end( clientRequestInternalOptions.Value );
			}
		});
	}
}