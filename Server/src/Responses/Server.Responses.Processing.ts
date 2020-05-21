
import * as http from 'http';
import * as fs from 'fs'
import * as path from 'path'
import * as mime from 'mime-types';

import { HTTPCodes } from '../HTTP.Codes';

import * as ComUtils from '../../../Common/Utils/ComUtils';
import FSUtils from '../../../Common/Utils/FSUtils';


export interface IServerRequestInternalOptions
{
	Identifier? : string;
	Key? : string;
	Value? : Buffer | null;
	Headers? : http.OutgoingHttpHeaders;
	FileStream? : fs.ReadStream;
}



export default class ServerResponsesProcessing
{
	
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


	/** End the response with value passed with 'serverRequestInternalOptions' */
	public static async Request_GET( request : http.IncomingMessage, response : http.ServerResponse, serverRequestInternalOptions : IServerRequestInternalOptions ) : Promise<ComUtils.IServerResponseResult>
	{
		return new Promise<ComUtils.IServerResponseResult>( ( resolve : ( value: ComUtils.IServerResponseResult ) => void ) =>
		{
			request.on('error', function( err : Error )
			{
				ServerResponsesProcessing.EndResponseWithError( response, err, 400 );
				ComUtils.ResolveWithError( "ServerResponses:Request_PUT", err, resolve );
			});

			response.on( 'error', ( err : Error ) =>
			{
				ServerResponsesProcessing.EndResponseWithError( response, err, 400 );
				ComUtils.ResolveWithError( "ServerResponses:Request_PUT", err, resolve );
			})
			response.on( 'finish', () =>
			{
				ServerResponsesProcessing.EndResponseWithGoodResult( response );
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
				ServerResponsesProcessing.EndResponseWithError( response, err, 400 );
				ComUtils.ResolveWithError( "ServerResponses:Request_GET", err, resolve );
			});

			request.on( 'data', function( chunk : any )
			{
				body.push( Buffer.from( chunk ) );
			});
			
			request.on( 'end', function()
			{
				const result : Buffer = Buffer.concat( body );
				ServerResponsesProcessing.EndResponseWithGoodResult( response );
				ComUtils.ResolveWithGoodResult( result, resolve );
			});
		});
	}

}