
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';

import FSUtils from '../../../../Common/Utils/FSUtils';
import * as ComUtils from '../../../../Common/Utils/ComUtils';
import { IClientRequestResult } from '../../../../Common/Interfaces';
import * as mime from 'mime-types';


export interface IClientRequestInternalOptions
{
	Identifier? : string;
	DownloadLocation?: string;
	Storage?: string;
	Key? : string;
	Value? : any;
	Headers? : Map<string, string | number | string[]>;
	FileStream? : fs.ReadStream;
}


export class ClientRequests {


	/////////////////////////////////////////////////////////////////////////////////////////
	public static async DownloadResource( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions = {} ) : Promise<IClientRequestResult>
	{
		const { DownloadLocation, Identifier } = clientRequestInternalOptions;

		const requestPath = new URLSearchParams();
		requestPath.set('identifier', Identifier);
		options.path += '?' + requestPath.toString();
		options.method = 'get';

		const result : IClientRequestResult = await ClientRequests.Request_GET( options, <IClientRequestInternalOptions>{} );
		if ( !result.bHasGoodResult )
		{
			return result;
		}

		const writeError : NodeJS.ErrnoException = await new Promise( ( resolve ) =>
		{
			FSUtils.EnsureDirectoryExistence(DownloadLocation);
			fs.writeFile( path.join( DownloadLocation, Identifier ), result.body, function( err : NodeJS.ErrnoException )
			{
				resolve( err );
			});
		});
		if ( writeError )
		{
			if ( FSUtils.ExistsSync( Identifier ) )
			{
				fs.unlinkSync( Identifier );
			}
			return ComUtils.ResolveWithError( `ClientRequests:DownloadResource`, `Download request of ${Identifier} failed\n${writeError}` );
		}
		return ComUtils.ResolveWithGoodResult<IClientRequestResult>( Buffer.from( "Done" ) );
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public static async UploadResource( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions = {} ) : Promise<IClientRequestResult>
	{
		const identifier = clientRequestInternalOptions.Identifier || '';

		// Check if file exists
		if ( fs.existsSync( identifier ) === false )
		{
			return ComUtils.ResolveWithError( "ClientRequests:UploadResource", `File ${identifier} doesn't exist` );
		}

		const filePathParsed = path.parse( identifier );

		// Headers
		clientRequestInternalOptions.Headers = new Map();
		{
			// Check if content type can be found
			// Considering https://stackoverflow.com/a/1176031 && https://stackoverflow.com/a/12560996 but appling https://stackoverflow.com/a/28652339
			const contentType : string = mime.lookup( filePathParsed.ext ) || 'application/octet-stream';
			clientRequestInternalOptions.Headers.set( 'content-type', contentType );
			
			// Check file Size
			const sizeInBytes : number | null = FSUtils.GetFileSizeInBytesOf( identifier );
			if ( sizeInBytes === null )
			{
				return ComUtils.ResolveWithError( "ClientRequests:UploadResource", `Cannot obtain size of file ${identifier}` );
			}
			clientRequestInternalOptions.Headers.set( 'content-length', sizeInBytes );
		}

		clientRequestInternalOptions.FileStream = fs.createReadStream( identifier );

		const requestPath = new URLSearchParams();
		requestPath.set('identifier', filePathParsed.base);
		options.path += '?' + requestPath.toString();

		return ClientRequests.Request_PUT( options, clientRequestInternalOptions );
	}


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