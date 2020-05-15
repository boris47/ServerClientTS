
import * as http from 'http';
import * as fs from 'fs'
import * as path from 'path'
import * as mime from 'mime-types';

import { HTTPCodes } from './HTTP.Codes';

import * as ComUtils from '../Common/Utils/ComUtils';
import FSUtils from '../Common/Utils/FSUtils';
import { IServerRequestInternalOptions } from './Server.ResponsesMap';



export class ServerResponses {

	private static readonly DOWNLOAD_LOCATION : string = '.\\Downloaded\\';


	public static EndResponseWithGoodResult( response : http.ServerResponse, chunk?: string | Buffer ) : void
	{
		response.statusCode = 200;
		response.end(chunk);
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
		response.end( msg );
	}

	
	/** Client -> Server */
	public static async DownloadFile( request : http.IncomingMessage, response : http.ServerResponse, serverRequestInternalOptions : IServerRequestInternalOptions ) : Promise<ComUtils.IServerResponseResult>
	{
		const result : ComUtils.IServerResponseResult = await ServerResponses.Request_PUT( request, response, <IServerRequestInternalOptions>{} );
		if ( !result.bHasGoodResult )
		{
			return result;
		}
		
		const filePath = path.join( ServerResponses.DOWNLOAD_LOCATION, serverRequestInternalOptions.Identifier );
		const bHasWriteGoodResult : boolean = await new Promise( ( resolve ) =>
		{
			FSUtils.EnsureDirectoryExistence( ServerResponses.DOWNLOAD_LOCATION );
			fs.writeFile( filePath, result.body, function( err: NodeJS.ErrnoException | null )
			{
				resolve( !err );
			});
		});
		if ( !bHasWriteGoodResult )
		{
			return ComUtils.ResolveWithError( `File Upload Failed`, `Upload request of ${serverRequestInternalOptions.Identifier} failed` );
		}
		ServerResponses.EndResponseWithGoodResult( response );
		return ComUtils.ResolveWithGoodResult( result.body );
	}

	/** Server -> Client */
	public static async UploadFile( request : http.IncomingMessage, response : http.ServerResponse, serverRequestInternalOptions : IServerRequestInternalOptions ) : Promise<ComUtils.IServerResponseResult>
	{
		const filePath = path.join( ServerResponses.DOWNLOAD_LOCATION, serverRequestInternalOptions.Identifier );

		// Check if file exists
		if ( !(await FSUtils.FileExistsAsync( filePath ) ))
		{
			const err = `File ${serverRequestInternalOptions.Identifier} doesn't exist`;
			ServerResponses.EndResponseWithError( response, err, 404 );
			return ComUtils.ResolveWithError( "ServerResponses:UploadFile", err );
		}

		serverRequestInternalOptions.Headers = {};
		{
			// Check if content type can be found
			const contentType : string = mime.lookup( path.parse(filePath).ext ) || 'application/octet-stream';
			serverRequestInternalOptions.Headers['content-type'] = contentType;
	
			// Check file Size
			const sizeInBytes : number | null = FSUtils.GetFileSizeInBytesOf( filePath );
			if ( sizeInBytes === null )
			{
				const err = `Cannot obtain size of file ${filePath}`;
				ServerResponses.EndResponseWithError( response, err, 400 );
				return ComUtils.ResolveWithError( "ServerResponses:UploadFile", err );
			}
			serverRequestInternalOptions.Headers['content-length'] = sizeInBytes;
		}

		serverRequestInternalOptions.FileStream = fs.createReadStream( filePath );

		return ServerResponses.Request_GET( request, response, serverRequestInternalOptions );
	}


	/** End the response with value passed with 'serverRequestInternalOptions' */
	public static async Request_GET( request : http.IncomingMessage, response : http.ServerResponse, serverRequestInternalOptions : IServerRequestInternalOptions ) : Promise<ComUtils.IServerResponseResult>
	{
		return new Promise<ComUtils.IServerResponseResult>( ( resolve : ( value: ComUtils.IServerResponseResult ) => void ) =>
		{
			request.on('error', function( err : Error )
			{
				ServerResponses.EndResponseWithError( response, err, 400 );
				ComUtils.ResolveWithError( "ServerResponses:Request_PUT", err, resolve );
			});

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

	
	/** Receive data storing them into buffer into returne value body */
	public static async Request_PUT( request : http.IncomingMessage, response : http.ServerResponse, serverRequestInternalOptions : IServerRequestInternalOptions ) : Promise<ComUtils.IServerResponseResult>
	{
		return new Promise<ComUtils.IServerResponseResult>( ( resolve : ( value: ComUtils.IServerResponseResult ) => void ) =>
		{
			const body : Buffer[] = [];

			request.on('error', function( err : Error )
			{
				ServerResponses.EndResponseWithError( response, err, 400 );
				ComUtils.ResolveWithError( "ServerResponses:Request_GET", err, resolve );
			});

			request.on( 'data', function( chunk : any )
			{
				body.push( Buffer.from( chunk ) );
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