
import * as http from 'http';
import * as fs from 'fs'
import * as path from 'path'
import * as mime from 'mime-types';

import { HTTPCodes } from './HTTP.Codes';
import { IServerResponseResult } from '../Common/Interfaces';
import * as ComUtils from '../Common/ComUtils';
import * as FSUtils from '../Common/FSUtils';
import { IServerRequestInternalOptions } from './Server.ResponsesMap';



export class ServerResponses {


	public static EndResponseWithGoodResult( response : http.ServerResponse ) : void
	{
		response.statusCode = 200;
		response.end();
	}


	public static EndResponseWithError( response : http.ServerResponse, errMessage : string | Error, errCode : number ) : void
	{
		let msg = '';
		if ( typeof errMessage === 'string' )
		{
			msg = `${errMessage}`;
		}
		else
		{
			msg = `${errMessage.name}:${errMessage.message}`;
		}

		response.statusCode = errCode;
		response.statusMessage = msg;
		response.end();
	}

	
	public static async DownloadFile( request : http.IncomingMessage, response : http.ServerResponse, serverRequestInternalOptions : IServerRequestInternalOptions ) : Promise<IServerResponseResult>
	{
		const result : IServerResponseResult = await ServerResponses.Request_PUT( request, response, <IServerRequestInternalOptions>{} );
		if ( !result.bHasGoodResult )
		{
			return result;
		}
		
		const bHasWriteGoodResult : boolean = await new Promise( ( resolve ) =>
		{
			fs.writeFile( serverRequestInternalOptions.FileName, result.body, function( err : NodeJS.ErrnoException )
			{
				resolve( !err );
			});
		});
		if ( !bHasWriteGoodResult )
		{
			if ( fs.existsSync( serverRequestInternalOptions.FileName ) )
			{
				fs.unlinkSync( serverRequestInternalOptions.FileName );
			}
			return ComUtils.ResolveWithError( `File Upload Failed`, `Upload request of ${serverRequestInternalOptions.FileName} failed` );
		}
		ServerResponses.EndResponseWithGoodResult( response );
		return ComUtils.ResolveWithGoodResult( result.body );
	}


	public static async UploadFile( request : http.IncomingMessage, response : http.ServerResponse, serverRequestInternalOptions : IServerRequestInternalOptions ) : Promise<IServerResponseResult>
	{
		const fileName = serverRequestInternalOptions.FileName;

		// Check if file exists
		if ( fs.existsSync( fileName ) === false )
		{
			const err = `File ${fileName} doesn't exist`;
			ServerResponses.EndResponseWithError( response, err, 400 );
			return ComUtils.ResolveWithError( "ServerResponses:UploadFile", err );
		}

		// Check if content type can be found
		const contentType : string | false = mime.lookup( path.parse(fileName).ext );
		if ( contentType === false )
		{
			const err = `Cannot define content type for file ${fileName}`;
			ServerResponses.EndResponseWithError( response, err, 400 );
			return ComUtils.ResolveWithError( "ServerResponses:UploadFile", err );
		}

		// Check file Size
		const sizeInBytes : number | null = FSUtils.GetFileSizeInBytesOf( fileName );
		if ( sizeInBytes === null )
		{
			const err = `Cannot obtain size of file ${fileName}`;
			ServerResponses.EndResponseWithError( response, err, 400 );
			return ComUtils.ResolveWithError( "ServerResponses:UploadFile", err );
		}

		serverRequestInternalOptions.Headers =
		{
			'content-type' : contentType,
			'content-length' : sizeInBytes
		};
		serverRequestInternalOptions.FileStream = fs.createReadStream( serverRequestInternalOptions.FileName );

		return ServerResponses.Request_GET( request, response, serverRequestInternalOptions );
	}

	/** End the response with value passed with 'serverRequestInternalOptions' */
	public static async Request_GET( request : http.IncomingMessage, response : http.ServerResponse, serverRequestInternalOptions : IServerRequestInternalOptions ) : Promise<IServerResponseResult>
	{
		return new Promise<IServerResponseResult>( ( resolve : ( value: IServerResponseResult ) => void ) =>
		{
			response.on( 'error', ( err : Error ) =>
			{
				ServerResponses.EndResponseWithError( response, err, 400 );
				ComUtils.ResolveWithError( "ServerResponses:Request_PUT", err, resolve );
			})
			response.on( 'finish', () =>
			{
				ServerResponses.EndResponseWithGoodResult( response );
				ComUtils.ResolveWithGoodResult( Buffer.from( HTTPCodes[200] ), resolve );
			});

			// Set headers
			if ( serverRequestInternalOptions.Headers )
			{
				for( const key in serverRequestInternalOptions.Headers )
				{
					const value = serverRequestInternalOptions.Headers[key];
					response.setHeader( key, value );
				}
			}

			// If upload of file is requested
			if ( serverRequestInternalOptions.FileStream )
			{
				serverRequestInternalOptions.FileStream.pipe( response );
			}
			else // direct value sent
			{
				response.end( serverRequestInternalOptions.Value );
			}
		});
	}

	/** Receive data storing them into buffer inside returne value body */
	public static async Request_PUT( request : http.IncomingMessage, response : http.ServerResponse, serverRequestInternalOptions : IServerRequestInternalOptions ) : Promise<IServerResponseResult>
	{
		return new Promise<IServerResponseResult>( ( resolve : ( value: IServerResponseResult ) => void ) =>
		{
			const body : any[] = [];

			request.on('error', function( err : Error )
			{
				ServerResponses.EndResponseWithError( response, err, 400 );
				ComUtils.ResolveWithError( "ServerResponses:Request_GET", err, resolve );
			});

			request.on( 'data', function( chunk : any )
			{
				body.push( chunk );
			});
			
			request.on( 'end', function()
			{
				const result : Buffer = Buffer.concat( body );
				ServerResponses.EndResponseWithGoodResult( response );
				ComUtils.ResolveWithGoodResult( result, resolve );
			});
		});
	}

}