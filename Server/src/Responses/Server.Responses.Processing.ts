
import * as http from 'http';
import * as stream from 'stream';

import { HTTPCodes } from '../HTTP.Codes';
import * as ComUtils from '../../../Common/Utils/ComUtils';
import { EHeaders } from '../../../Common/Interfaces';
import { StreamLimitator } from '../../../Common/Utils/GenericUtils';


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

interface IResponsePreconditions
{
	RequestedHeaders: string[];
	SearchParams: Map<string, string>;
}

// TODO implementation
function VerifyPreconditions( request: http.IncomingMessage, preconditions: IResponsePreconditions ): boolean
{
	let bResult = true;

	const { headers, url } = request
	// RequestedHeaders
	{
		for( const requestedHeader of preconditions.RequestedHeaders )
		{
			if (request.headers[requestedHeader] === undefined)
			{
				const errMessage = `Request "${request.url}:${request.method}" missing ${requestedHeader}`;
			//	ServerResponsesProcessing.EndResponseWithError( response, HTTPCodes[411], 411 );
			//	return ComUtils.ResolveWithError( 'ServerResponseResources.ClientToServer', errMessage );
			}
		}
	}

	return bResult;
}

export default class ServerResponsesProcessing
{
	public static readonly Buffer_OK: Buffer = Buffer.from('OK');

	/** */
	private static ResetServerInternalOptionsToBad(serverRequestInternalOptions : IServerRequestInternalOptions): void
	{
		serverRequestInternalOptions.WriteStream?.removeAllListeners();
		serverRequestInternalOptions.WriteStream?.destroy();
		serverRequestInternalOptions.ReadStream?.removeAllListeners();
		serverRequestInternalOptions.ReadStream?.unpipe();
		serverRequestInternalOptions.ReadStream?.destroy();
		serverRequestInternalOptions.Value = undefined;
	}


	/**  */
	public static EndResponseWithGoodResult( response : http.ServerResponse, chunk: string | Buffer = undefined ) : void
	{
		response.statusCode = 200;
		response.end(chunk);
	}


	public static EndResponseWithError( response : http.ServerResponse, errMessage : string | Error, errCode : number ) : void
	{
		const msg = typeof errMessage === 'string' ? `${errMessage}` : `${errMessage.name}:${errMessage.message}`;
		response.statusCode = errCode;
		response.end( msg );
	}


	/** Client -> Server */
	public static HandleDownload( request : http.IncomingMessage, response : http.ServerResponse, serverRequestInternalOptions : IServerRequestInternalOptions ) : Promise<Buffer | Error>
	{
		return new Promise<Buffer | Error>( ( resolve : ( value: Buffer | Error ) => void ) =>
		{
			ServerResponsesProcessing.PrepareRequest(request, response, serverRequestInternalOptions, resolve);

			// If for this request a writestream is provived, then the content will be written on this stream
			if ( serverRequestInternalOptions.WriteStream )
			{
				request.pipe( serverRequestInternalOptions.WriteStream );
				
				serverRequestInternalOptions.WriteStream.on( 'error', ( err: Error ) =>
				{
					ServerResponsesProcessing.EndResponseWithError( response, err, 500 ); // Internal Server Error
					ComUtils.ResolveWithError( "ServerResponsesProcessing:HandleDownload[WriteStream]", err, resolve );
					ServerResponsesProcessing.ResetServerInternalOptionsToBad(serverRequestInternalOptions);
				});
				
				serverRequestInternalOptions.WriteStream.on( 'close', (src: stream.Readable) =>
				{
					serverRequestInternalOptions.WriteStream.destroy();
					ServerResponsesProcessing.EndResponseWithGoodResult( response, ServerResponsesProcessing.Buffer_OK );
					const result = Buffer.from( 'ServerResponsesProcessing:HandleDownload[WriteStream]: Data received correcly' );
					ComUtils.ResolveWithGoodResult( result, resolve );
				});
			}
			// Otherwise the content will be stored into a buffer
			else
			{
				const contentLength = parseInt(request.headers['content-length'], 10);
				const body = new Array<Buffer>();
				let currentLength: number = 0;
				request.on( 'data', function( chunk : Buffer )
				{
					currentLength += chunk.length;
					body.push(chunk);
					
					if (contentLength < currentLength)
					{
						request.destroy();
						const errMessage = `Request "${request.url}:${request.method}" data length exceed(${currentLength}) content length(${contentLength})!`;
						ServerResponsesProcessing.EndResponseWithError( response, errMessage, 413 ); // TODO Ensure correct status code
						ComUtils.ResolveWithError( 'ServerResponsesProcessing:ProcessRequest', errMessage, resolve );
						ServerResponsesProcessing.ResetServerInternalOptionsToBad(serverRequestInternalOptions);
					}
				});
				
				request.on( 'end', function()
				{
					const result : Buffer = Buffer.concat( body, currentLength );
					ServerResponsesProcessing.EndResponseWithGoodResult( response, ServerResponsesProcessing.Buffer_OK );
					ComUtils.ResolveWithGoodResult( result, resolve );
				});
			}
		});
	}


	/** Server -> Client */
	public static HandleUpload( request : http.IncomingMessage, response : http.ServerResponse, serverRequestInternalOptions : IServerRequestInternalOptions ): Promise<Buffer | Error>
	{
		return new Promise<Buffer | Error>( ( resolve : ( value: Buffer | Error ) => void ) =>
		{
			let maxTransferSpeed = parseInt(request.headers[EHeaders.TRANSFER_SPEED] as string || '0', 10);
			// converts to bytes per ms
			maxTransferSpeed = Math.floor((Math.max(maxTransferSpeed, 0) * 1024) / 1000.0) || Number.MAX_SAFE_INTEGER;;

			ServerResponsesProcessing.PrepareRequest(request, response, serverRequestInternalOptions, resolve);

			// If read stream is available
			if ( serverRequestInternalOptions.ReadStream )
			{
				serverRequestInternalOptions.ReadStream.on( 'error', ( err: Error ) =>
				{
					ServerResponsesProcessing.EndResponseWithError( response, err, 500 ); // Internal Server Error
					ComUtils.ResolveWithError( "ServerResponsesProcessing:HandleUpload[ReadStream]", err );
					ServerResponsesProcessing.ResetServerInternalOptionsToBad(serverRequestInternalOptions);
				});

				const limitedStream = serverRequestInternalOptions.ReadStream.pipe(new StreamLimitator(maxTransferSpeed, 1));
				response = limitedStream.pipe( response ).on( 'close', () =>
				{
					serverRequestInternalOptions.ReadStream.destroy();
					ServerResponsesProcessing.EndResponseWithGoodResult( response );
					ComUtils.ResolveWithGoodResult( Buffer.from( 'ServerResponsesProcessing:HandleUpload[ReadStream]: Data sent correcly' ), resolve );
				});
			}
			
			// direct value sent
			if ( !( serverRequestInternalOptions.Value === undefined) )
			{
				response.end(serverRequestInternalOptions.Value);
			}
		});
	}


	/** Client -> Server (No Write Stream) */
	public static ProcessSimpleResponse( request : http.IncomingMessage, response : http.ServerResponse, serverRequestInternalOptions : IServerRequestInternalOptions ): Promise<Buffer | Error>
	{
		serverRequestInternalOptions.WriteStream?.destroy(); // Ensura data will be sent into body
		serverRequestInternalOptions.WriteStream = undefined;
		return ServerResponsesProcessing.HandleDownload(request, response, serverRequestInternalOptions);
	}


	/**  */
	private static PrepareRequest( request : http.IncomingMessage, response : http.ServerResponse, serverRequestInternalOptions : IServerRequestInternalOptions, resolve : ( value: Buffer | Error ) => void ) : void
	{
		response.on( 'error', ( err : Error ) =>
		{
			ServerResponsesProcessing.EndResponseWithError( response, err, 400 ); // Bad Request
			ComUtils.ResolveWithError( 'ServerResponsesProcessing:ProcessRequest', err, resolve );
			ServerResponsesProcessing.ResetServerInternalOptionsToBad(serverRequestInternalOptions);
		});

		/** Emitted when the request has been aborted. */
		request.on( 'aborted', () =>
		{
			const errMessage = `Request "${request.url}:${request.method}" has been aborted`;
			ComUtils.ResolveWithError( 'ServerResponsesProcessing:ProcessRequest', errMessage, resolve );
			ServerResponsesProcessing.ResetServerInternalOptionsToBad(serverRequestInternalOptions);
		});

		// Set headers
		for( const [key, value] of Object.entries(serverRequestInternalOptions.Headers || {} ))
		{
			response.setHeader( key, value );
		}
	}

}