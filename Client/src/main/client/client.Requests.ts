
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

import FSUtils from '../../../../Common/FSUtils';
import * as ComUtils from '../../../../Common/ComUtils';
import { IClientRequestResult } from '../../../../Common/Interfaces';
import * as mime from 'mime-types';


export interface IClientRequestInternalOptions
{
	AbsoluteFilePath? : string;
	Storage?: string;
	Key? : string;
	Value? : any;
	Headers? : Map<string, string | number | string[]>;
	FileStream? : fs.ReadStream;
}


export class ClientRequests {

	public static async DownloadFile( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions = {} ) : Promise<IClientRequestResult>
	{
		const absoluteFilePath = clientRequestInternalOptions.AbsoluteFilePath || '';

		const requestPath = new URLSearchParams();
		requestPath.set('file', path.parse( absoluteFilePath ).base);
		options.path += '?' + requestPath.toString();
		options.method = 'get';

		const result : IClientRequestResult = await ClientRequests.Request_GET( options, <IClientRequestInternalOptions>{} );
		if ( !result.bHasGoodResult )
		{
			return result;
		}

		const writeError : NodeJS.ErrnoException = await new Promise( ( resolve ) =>
		{
			const folderPath = path.parse( absoluteFilePath ).dir;
			FSUtils.EnsureDirectoryExistence(folderPath);
			fs.writeFile( absoluteFilePath, result.body, function( err : NodeJS.ErrnoException )
			{
				resolve( err );
			});
		});
		if ( writeError )
		{
			if ( fs.existsSync( absoluteFilePath ) )
			{
				fs.unlinkSync( absoluteFilePath );
			}
			return ComUtils.ResolveWithError( `ClientRequests:DownloadFile`, `Upload request of ${absoluteFilePath} failed\n${writeError}` );
		}
		return ComUtils.ResolveWithGoodResult<IClientRequestResult>( Buffer.from( "Done" ) );
	}


	public static async UploadFile( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions = {} ) : Promise<IClientRequestResult>
	{
		const AbsoluteFilePath = clientRequestInternalOptions.AbsoluteFilePath || '';

		// Check if file exists
		if ( fs.existsSync( AbsoluteFilePath ) === false )
		{
			return ComUtils.ResolveWithError( "ClientRequests:UploadFile", `File ${AbsoluteFilePath} doesn't exist` );
		}

		const filePathParsed = path.parse( AbsoluteFilePath );
		// Check if content type can be found
		const contentType : string | false = mime.lookup( filePathParsed.ext );
		if ( contentType === false )
		{
			return ComUtils.ResolveWithError( "ClientRequests:UploadFile", `Cannot define content type for file ${AbsoluteFilePath}` );
		}

		// Check file Size
		const sizeInBytes : number | null = FSUtils.GetFileSizeInBytesOf( AbsoluteFilePath );
		if ( sizeInBytes === null )
		{
			return ComUtils.ResolveWithError( "ClientRequests:UploadFile", `Cannot obtain size of file ${AbsoluteFilePath}` );
		}

		clientRequestInternalOptions.Headers = new Map();
		clientRequestInternalOptions.Headers.set( 'content-type', contentType );
		clientRequestInternalOptions.Headers.set( 'content-length', sizeInBytes );
		clientRequestInternalOptions.FileStream = fs.createReadStream( AbsoluteFilePath );

		const requestPath = new URLSearchParams();
		requestPath.set('file', filePathParsed.base);
		options.path += '?' + requestPath.toString();

		return ClientRequests.Request_PUT( options, clientRequestInternalOptions );
	}


	public static async Request_GET( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions = {} ) : Promise<IClientRequestResult>
	{
		return new Promise<IClientRequestResult>( (resolve) =>
		{
			if ( clientRequestInternalOptions.Storage && clientRequestInternalOptions.Key )
			{
				const path = new URLSearchParams();
				path.set( 'stg', clientRequestInternalOptions.Storage );
				path.set( 'key', clientRequestInternalOptions.Key );
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

				const body : any[] = [];

				response.on( 'error', ( err : Error ) =>
				{
					ComUtils.ResolveWithError( 'ClientRequests:Request_GET:[ResponseError]', `${err.name}:${err.message}`, resolve );
				});

				response.on( 'data', function( chunk : any )
				{
					body.push( chunk );
				})

				response.on( 'end', function()
				{
					const result : Buffer = Buffer.concat( body );
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
				for( let [key, value] of clientRequestInternalOptions.Headers )
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