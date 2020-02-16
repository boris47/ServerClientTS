
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

import * as FSUtils from '../Common/FSUtils';
import * as ComUtils from '../Common/ComUtils';
import { IClientRequestResult } from '../Common/Interfaces';
import * as mime from 'mime-types';


export interface IClientRequestInternalOptions
{
	AbsoluteFilePath? : string;
	Key? : string;
	Value? : any;
	Headers? : {
		[key:string] : any
	};
	FileStream? : fs.ReadStream;
}


export class ClientRequests {

	public static async DownloadFile( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions = {} ) : Promise<IClientRequestResult>
	{
		options.path += `?file=${path.parse( clientRequestInternalOptions.AbsoluteFilePath ).base}`;
		options.method = 'get';

		const result : IClientRequestResult = await ClientRequests.Request_GET( options, <IClientRequestInternalOptions>{} );
		if ( !result.bHasGoodResult )
		{
			return result;
		}

		const bHasWriteGoodResult : boolean = await new Promise( ( resolve ) =>
		{
			fs.writeFile( clientRequestInternalOptions.AbsoluteFilePath, result.body, function( err : NodeJS.ErrnoException )
			{
				resolve( !err );
			});
		});
		if ( !bHasWriteGoodResult )
		{
			if ( fs.existsSync( clientRequestInternalOptions.AbsoluteFilePath ) )
			{
				fs.unlinkSync( clientRequestInternalOptions.AbsoluteFilePath );
			}
			return ComUtils.ResolveWithError( `ClientRequests:DownloadFile`, `Upload request of ${clientRequestInternalOptions.AbsoluteFilePath} failed` );
		}
		return ComUtils.ResolveWithGoodResult<IClientRequestResult>( Buffer.from( "Done" ) );
	}


	public static async UploadFile( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions = {} ) : Promise<IClientRequestResult>
	{
		const AbsoluteFilePath = clientRequestInternalOptions.AbsoluteFilePath;

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

		clientRequestInternalOptions.Headers =
		{
			'content-type' : contentType,
			'content-length' : sizeInBytes
		};
		clientRequestInternalOptions.FileStream = fs.createReadStream( AbsoluteFilePath );
		options.path += `?file=${filePathParsed.base}`;

		return ClientRequests.Request_PUT( options, clientRequestInternalOptions );
	}


	public static async Request_GET( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions = {} ) : Promise<IClientRequestResult>
	{
		return new Promise<IClientRequestResult>( (resolve) =>
		{
			if ( clientRequestInternalOptions.Key )
			{
				options.path += `?key=${clientRequestInternalOptions.Key}`
			}

			const request : http.ClientRequest = http.request( options );
			request.on( 'response', ( response: http.IncomingMessage ) : void =>
			{
				const statusCode : number = response.statusCode;
				if ( statusCode !== 200 )
				{
					ComUtils.ResolveWithError( 'ClientRequests:Request_GET', `${response.statusCode}:${response.statusMessage}`, resolve );
					return;
				}

				const body : any[] = [];

				response.on( 'error', ( err : Error ) =>
				{
					ComUtils.ResolveWithError( 'ClientRequests:Request_GET', `${err.name}:${err.message}`, resolve );
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
				return ComUtils.ResolveWithError( 'ClientRequests:Request_GET', `${err.name}:${err.message}`, resolve );
			})
			request.end();
		});
	}


	public static async Request_PUT( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions = {} ) : Promise<IClientRequestResult>
	{
		return new Promise<IClientRequestResult>( (resolve) =>
		{
			if ( clientRequestInternalOptions.Key )
			{
				options.path += `?key=${clientRequestInternalOptions.Key}`
			}

			const request : http.ClientRequest = http.request( options );
			request.on( 'response', ( response: http.IncomingMessage ) : void =>
			{
				const statusCode : number = response.statusCode;
				if ( statusCode !== 200 )
				{
					ComUtils.ResolveWithError( "ClientRequests:Request_PUT", `${response.statusCode}:${response.statusMessage}`, resolve );
				}
			});

			request.on( 'close', function()
			{
				ComUtils.ResolveWithGoodResult( Buffer.from( "Done" ), resolve );
			});
			
			request.on('error', function( err : Error )
			{
				ComUtils.ResolveWithError( "ClientRequests:Request_PUT", `${err.name}:${err.message}`, resolve );
			});

			// Set headers
			if ( clientRequestInternalOptions.Headers )
			{
				for( const key in clientRequestInternalOptions.Headers )
				{
					const value = clientRequestInternalOptions.Headers[key];
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