
import * as http from 'http';
import * as stream from 'stream'

import { HTTPCodes } from '../HTTP.Codes';
import * as ComUtils from '../../../Common/Utils/ComUtils';


export interface IServerRequestInternalOptions
{
	Key? : string;
	Value? : Buffer | null;
	Headers? : http.OutgoingHttpHeaders;
	FilePath?: string;
	ReadStream? : stream.Readable;
	WriteStream? : stream.Writable;
	OnSuccess? : Function;
	OnFailure? : Function;
};




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


	private static HandleDownload( request : http.IncomingMessage, response : http.ServerResponse, serverRequestInternalOptions : IServerRequestInternalOptions, resolve : ( value: ComUtils.IServerResponseResult ) => void ): void
	{
		// If for this request a writestream is provived, then the content will be written on this stream
		if ( serverRequestInternalOptions.WriteStream )
		{
			request.pipe( serverRequestInternalOptions.WriteStream );
			
			serverRequestInternalOptions.WriteStream.on( 'error', ( err: Error ) =>
			{
				ServerResponsesProcessing.EndResponseWithError( response, err, 500 ); // Internal Server Error
				ComUtils.ResolveWithError( "ServerResponsesProcessing:HandleDownload[WriteStream]", err, resolve );
			});
			
			serverRequestInternalOptions.WriteStream.on( 'finish', () =>
			{
				const result = Buffer.from( 'ServerResponsesProcessing:HandleDownload: Data received correcly' );
				ServerResponsesProcessing.EndResponseWithGoodResult( response );
				ComUtils.ResolveWithGoodResult( result, resolve );
			})
		}
		// Otherwise the content will be stored into a buffer
		else
		{
			const body = new Array<Buffer>();
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
	}

	private static HandleUpload( response : http.ServerResponse, serverRequestInternalOptions : IServerRequestInternalOptions ): void
	{
		// If upload of resource is requested
		if ( serverRequestInternalOptions.ReadStream )
		{
			serverRequestInternalOptions.ReadStream.pipe( response );
		}
		else // direct value sent
		{
			response.end( serverRequestInternalOptions.Value );
		}
	}


	public static async ProcessRequest( request : http.IncomingMessage, response : http.ServerResponse, serverRequestInternalOptions : IServerRequestInternalOptions ) : Promise<ComUtils.IServerResponseResult>
	{
		return new Promise<ComUtils.IServerResponseResult>( ( resolve : ( value: ComUtils.IServerResponseResult ) => void ) =>
		{
			response.on( 'error', ( err : Error ) =>
			{
				ServerResponsesProcessing.EndResponseWithError( response, err, 400 ); // Bad Request
				ComUtils.ResolveWithError( "ServerResponsesProcessing:ProcessRequest", err, resolve );
			});

			/** Emitted when the request has been aborted. */
			response.on( 'aborted', () =>
			{
				const err = `Request "${request.url}:${request.method}" has been aborted`;
				ComUtils.ResolveWithError( "ServerResponsesProcessing:ProcessRequest", err, resolve );
			});

			/** Emitted when the response has been sent. More specifically,
			 * this event is emitted when the last segment of the response headers and body have
			 * been handed off to the operating system for transmission over the network.
			 * It does not imply that the client has received anything yet.
			 */
			response.on( 'finish', () =>
			{
				ServerResponsesProcessing.EndResponseWithGoodResult( response );
				ComUtils.ResolveWithGoodResult( Buffer.from( HTTPCodes[200] ), resolve );
			});

			// Set headers
			if ( serverRequestInternalOptions.Headers )
			{
				for( const [key, value] of Object.entries(serverRequestInternalOptions.Headers ))
				{
					response.setHeader( key, value );
				}
			}

			this.HandleDownload( request, response, serverRequestInternalOptions, resolve );
			this.HandleUpload(response, serverRequestInternalOptions );
		});
	}














	

	/** Server -> Client' */ /*
	public static async ServetToClient( request : http.IncomingMessage, response : http.ServerResponse, serverRequestInternalOptions : IServerRequestInternalOptions ) : Promise<ComUtils.IServerResponseResult>
	{
		return new Promise<ComUtils.IServerResponseResult>( ( resolve : ( value: ComUtils.IServerResponseResult ) => void ) =>
		{
			response.on( 'error', ( err : Error ) =>
			{
				ServerResponsesProcessing.EndResponseWithError( response, err, 400 ); // Bad Request
				ComUtils.ResolveWithError( "ServerResponses:ServetToClient", err, resolve );
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
*/
	
	/** Client -> Server */ /*
	public static async ClientToServer( request : http.IncomingMessage, response : http.ServerResponse, serverRequestInternalOptions : IServerRequestInternalOptions ) : Promise<ComUtils.IServerResponseResult>
	{
		return new Promise<ComUtils.IServerResponseResult>( ( resolve : ( value: ComUtils.IServerResponseResult ) => void ) =>
		{
			// If for this request a writestream is provived, then the content will be written on this stream
			if ( serverRequestInternalOptions.WriteStream )
			{
				request.pipe( serverRequestInternalOptions.WriteStream );
				
				serverRequestInternalOptions.WriteStream.on( 'error', ( err: Error ) =>
				{
					ServerResponsesProcessing.EndResponseWithError( response, err, 500 ); // Internal Server Error
					ComUtils.ResolveWithError( "ServerResponses:ClientToServer[WriteStream]", err, resolve );
				});
				
				serverRequestInternalOptions.WriteStream.on( 'finish', () =>
				{
					const result = Buffer.from( 'ServerResponsesProcessing:ClientToServer: Data received correcly' );
					ServerResponsesProcessing.EndResponseWithGoodResult( response );
					ComUtils.ResolveWithGoodResult( result, resolve );
				})
			}
			// Otherwise the content will be stored into a buffer
			else
			{
				const body = new Array<Buffer>();
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
*/
}