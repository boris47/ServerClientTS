
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

import * as FSUtils from '../Common/FSUtils';
import * as ComUtils from '../Common/ComUtils';
import { IClientRequestResult } from '../Common/Interfaces';
import * as mime from 'mime-types';


export class ClientRequests {

	public static async DownloadFile( options: http.RequestOptions, fileName : string ) : Promise<IClientRequestResult>
	{
		return new Promise<IClientRequestResult>( ( resolve : ( value: IClientRequestResult ) => void ) =>
		{
			options.path += `?file=${fileName}`;
			options.method = 'get';
			http.request( options, function( response: http.IncomingMessage )
			{
				const statusCode : number = response.statusCode;
				if ( statusCode !== 200 )
				{
					return ComUtils.ResolveWithError( 'ClientRequests:DownloadFile', `${response.statusCode}:${response.statusMessage}`, resolve );
				}

				let rawData = new Array<any>();
				response
				.on( 'data', ( chunk : any ) => rawData.push( chunk ) )
				.on( 'end', () =>
				{
					const body : Buffer = Buffer.concat( rawData );
					return ComUtils.ResolveWithGoodResult<IClientRequestResult>( body, resolve );
				});
			})
			.on('error', function( err : Error )
			{
				return ComUtils.ResolveWithError( 'ClientRequests:DownloadFile', `${err.name}:${err.message}`, resolve );
			})
			.end();
		});
	}


	public static async UploadFile( options: http.RequestOptions, absoluteFilePath : string ) : Promise<IClientRequestResult>
	{
		return new Promise<IClientRequestResult>( ( resolve : ( value: IClientRequestResult ) => void ) =>
		{
			// Check if file exists
			if ( fs.existsSync( absoluteFilePath ) === false )
			{
				return ComUtils.ResolveWithError( "ClientRequests:UploadFile", `File ${absoluteFilePath} doesn't exist`, resolve );
			}

			const filePathParsed = path.parse( absoluteFilePath );
			// Check if content type can be found
			const contentType : string | false = mime.lookup( filePathParsed.ext );
			if ( contentType === false )
			{
				return ComUtils.ResolveWithError( "ClientRequests:UploadFile", `Cannot define content type for file ${absoluteFilePath}`, resolve );
			}

			// Check file Size
			const bytes : number | null = FSUtils.GetFileSizeInBytesOf( absoluteFilePath );
			if ( bytes === null )
			{
				return ComUtils.ResolveWithError( "ClientRequests:UploadFile", `Cannot obtain size of file ${absoluteFilePath}`, resolve );
			}
			
			options.path += `?file=${filePathParsed.base}`;
			const request : http.ClientRequest = http.request( options );
			
			// Content type and length
			request.setHeader( 'content-type', contentType );
			request.setHeader( 'content-length', bytes );

			// Response Check
			request.on( 'response', function( response: http.IncomingMessage )
			{
				if ( response.statusCode !== 200 )
				{
					return ComUtils.ResolveWithError( "ClientRequests:UploadFile", `${response.statusCode}:${response.statusMessage}`, resolve );
				}
				return ComUtils.ResolveWithGoodResult( Buffer.from( "Done" ), resolve );
			});

			request.on( 'pipe', function( src : fs.ReadStream )
			{
				console.log( "PUT", `"${absoluteFilePath}"`, contentType, bytes );
			})

			// Error Callback
			request.on( 'error', function( err : Error )
			{
				return ComUtils.ResolveWithError( "ClientRequests:UploadFile", `${err.name}:${err.message}`, resolve );
			});

			// Pipe to file
			const readStream : fs.ReadStream =  fs.createReadStream( absoluteFilePath );
			readStream.pipe( request );
		});
	}


	public static async Request_GET( options: http.RequestOptions, key : string ) : Promise<IClientRequestResult>
	{
		return new Promise<IClientRequestResult>( (resolve) =>
		{
			options.path += `?key=${key}`
			http.request( options, ( response: http.IncomingMessage ) =>
			{
				const statusCode : number = response.statusCode;
				if ( statusCode !== 200 )
				{
					return ComUtils.ResolveWithError( 'ClientRequests:Request_GET', `${response.statusCode}:${response.statusMessage}`, resolve );
				}

				let rawData = new Array<any>();
				response
				.on( 'data', ( chunk : any ) => rawData.push( chunk ) )
				.on( 'end', () =>
				{
					const body : Buffer = Buffer.concat( rawData );
					return ComUtils.ResolveWithGoodResult( body, resolve );
				})
				.on( 'error', ( err : Error ) =>
				{
					return ComUtils.ResolveWithError( 'ClientRequests:Request_GET', `${err.name}:${err.message}`, resolve );
				});
			})
			.on('error', function( err : Error )
			{
				return ComUtils.ResolveWithError( 'ClientRequests:Request_GET', `${err.name}:${err.message}`, resolve );
			})
			.end();
		});
	}


	public static async Request_PUT( options: http.RequestOptions, key : string, data : string ) : Promise<IClientRequestResult>
	{
		return new Promise<IClientRequestResult>( (resolve) =>
		{
			options.path += `?key=${key}`;
			const request : http.ClientRequest = http.request( options );

			// Response Check
			request.on( 'response', function( response: http.IncomingMessage )
			{
				const statusCode : number = response.statusCode;
				if ( statusCode !== 200 )
				{
					return ComUtils.ResolveWithError( "ClientRequests:Request_PUT", `${response.statusCode}:${response.statusMessage}`, resolve );
				}
			});

			// Error Callback
			request.on('error', function( err : Error )
			{
				return ComUtils.ResolveWithError( "ClientRequests:Request_PUT", `${err.name}:${err.message}`, resolve );
			});

			request.on( 'close', function()
			{
				return ComUtils.ResolveWithGoodResult( Buffer.from( "Done" ), resolve );
			});

			request.end( data );
		});
	}
}