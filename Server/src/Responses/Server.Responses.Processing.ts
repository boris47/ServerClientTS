
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
	ReadStream? : fs.ReadStream;
	WriteStream? : fs.WriteStream;
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


	/** Resource: Server -> Client' */
	public static async Request_GET( request : http.IncomingMessage, response : http.ServerResponse, serverRequestInternalOptions : IServerRequestInternalOptions ) : Promise<ComUtils.IServerResponseResult>
	{
		return new Promise<ComUtils.IServerResponseResult>( ( resolve : ( value: ComUtils.IServerResponseResult ) => void ) =>
		{
			request.on('error', function( err : Error )
			{
				ServerResponsesProcessing.EndResponseWithError( response, err, 400 );
				ComUtils.ResolveWithError( "ServerResponses:Request_GET", err, resolve );
			});

			response.on( 'error', ( err : Error ) =>
			{
				ServerResponsesProcessing.EndResponseWithError( response, err, 400 );
				ComUtils.ResolveWithError( "ServerResponses:Request_GET", err, resolve );
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

			// If upload of resource is requested
			if ( serverRequestInternalOptions.ReadStream )
			{
				serverRequestInternalOptions.ReadStream.pipe( response );
			}
			else // direct value sent
			{
				response.end( serverRequestInternalOptions.Value );
			}
		});
	}

	
	/** Resource: Client -> Server */
	public static async Request_PUT( request : http.IncomingMessage, response : http.ServerResponse, serverRequestInternalOptions : IServerRequestInternalOptions ) : Promise<ComUtils.IServerResponseResult>
	{
		return new Promise<ComUtils.IServerResponseResult>( ( resolve : ( value: ComUtils.IServerResponseResult ) => void ) =>
		{
			request.on('error', function( err : Error )
			{
				ServerResponsesProcessing.EndResponseWithError( response, err, 400 ); // Bad Request
				ComUtils.ResolveWithError( "ServerResponses:Request_PUT", err, resolve );
			});

			// If for this request a writestream is provived, then the content will be written on this stream
			if ( serverRequestInternalOptions.WriteStream )
			{
				request.pipe( serverRequestInternalOptions.WriteStream );
				
				serverRequestInternalOptions.WriteStream.on( 'error', ( err: Error ) =>
				{
					ServerResponsesProcessing.EndResponseWithError( response, err, 500 ); // Internal Server Error
					ComUtils.ResolveWithError( "ServerResponses:Request_PUT[WriteStream]", err, resolve );
				});
				
				serverRequestInternalOptions.WriteStream.on( 'finish', () =>
				{
					const result = Buffer.from( 'ServerResponsesProcessing:Request_PUT: Data received correcly' );
					ServerResponsesProcessing.EndResponseWithGoodResult( response );
					ComUtils.ResolveWithGoodResult( result, resolve );
				})
			}
			// Otherwise the content will be stored into a buffer
			else
			{
				const body : Buffer[] = [];
				let contentLength = 0;
				request.on( 'data', function( chunk : Buffer )
				{
					body.push( chunk );
					contentLength += chunk.length;
				});
				
				request.on( 'end', function()
				{
					const result : Buffer = Buffer.concat( body, contentLength );
					ServerResponsesProcessing.EndResponseWithGoodResult( response );
					ComUtils.ResolveWithGoodResult( result, resolve );
				});
			}
		});
	}

}