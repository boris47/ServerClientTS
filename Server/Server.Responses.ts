
import * as http from 'http';
import * as fs from 'fs'
import * as path from 'path'
import * as mime from 'mime-types';

import { HTTPCodes } from './HTTP.Codes';
import { HttpResponse, AsyncHttpResponse } from './HttpResponse';
import { IServerResponseResult } from '../Common/Interfaces';
import * as ComUtils from '../Common/ComUtils';
import * as FSUtils from '../Common/FSUtils';
import { ServerStorage } from './Server.Storage';


interface IServerRequestInternalOptions
{
	FileName? : string;
	Key? : string
	Value? : any
}


export const MethodNotAllowed = new HttpResponse( 405, `{ "codeMessage": "${HTTPCodes[405]}" }` );
export interface IResponseMethods {
	post? 		: ( request : http.IncomingMessage, response : http.ServerResponse ) => HttpResponse;
	get? 		: ( request : http.IncomingMessage, response : http.ServerResponse ) => HttpResponse;
	put? 		: ( request : http.IncomingMessage, response : http.ServerResponse ) => HttpResponse;
	patch? 		: ( request : http.IncomingMessage, response : http.ServerResponse ) => HttpResponse;
	delete? 	: ( request : http.IncomingMessage, response : http.ServerResponse ) => HttpResponse;
}

interface ServerResponseMap {
	[key:string] : IResponseMethods
}

export const ResponsesMap : ServerResponseMap = {

	'/upload' : <IResponseMethods>
	{
		put 	: ( request : http.IncomingMessage, response : http.ServerResponse ) =>
		{
			return new AsyncHttpResponse( async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<IServerResponseResult> =>
			{
				// Execute file upload to client
				const fileName = request.url.split('=')[1];
				const options = <IServerRequestInternalOptions>
				{
					FileName : fileName
				};
				return await ServerResponses.DownloadFile( request, response, options );
			});
		}
	},

	'/download' : <IResponseMethods>
	{
		get 	: ( request : http.IncomingMessage, response : http.ServerResponse ) => 
		{
			return new AsyncHttpResponse( async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<IServerResponseResult> =>
			{
				// Execute file download server side
				const fileName = request.url.split('=')[1];
				const options = <IServerRequestInternalOptions>
				{
					FileName : fileName
				};
				return await ServerResponses.UploadFile( request, response, options );
			});
		}
	},

	'/data' : <IResponseMethods>
	{
		get		: ( request : http.IncomingMessage, response : http.ServerResponse ) => 
		{
			return new AsyncHttpResponse( async ( request, response ) : Promise<IServerResponseResult> =>
			{
				const key = request.url.split('=')[1];
				const value = ServerStorage.HasEntry( key ) ? ServerStorage.GetEntry( key ) : null;
				const options = <IServerRequestInternalOptions>
				{
					Key : key,
					Value : value
				};
				return await ServerResponses.Request_GET( request, response, options );
			});
		},
		put 	: ( request : http.IncomingMessage, response : http.ServerResponse ) =>
		{
			return new AsyncHttpResponse( async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<IServerResponseResult> =>
			{
				const key = request.url.split('=')[1];
				const options = <IServerRequestInternalOptions>
				{
					Key : key
				};
				const result : IServerResponseResult = await ServerResponses.Request_PUT( request, response, options );
				if ( result.bHasGoodResult )
				{
					ServerStorage.AddEntry( key, result.body );
				}
				return result;
			});
		}
	}

};


ResponsesMap['/ping'] = {
	post 		:	( request: http.IncomingMessage, response: http.ServerResponse ) => new HttpResponse( 200, "Hi there" ),
	get 		:	( request: http.IncomingMessage, response: http.ServerResponse ) =>
	{
		return new AsyncHttpResponse( async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<IServerResponseResult> =>
		{
			ServerResponses.EndResponseWithGoodResult( response );
			return new Promise<IServerResponseResult>( ( resolve ) =>
			{
				ComUtils.ResolveWithGoodResult( Buffer.from( "Hi there" ), resolve );
			});
		});
	},
	put 		:	( request: http.IncomingMessage, response: http.ServerResponse ) => new HttpResponse( 200, "Hi there" ),
	patch 		:	( request: http.IncomingMessage, response: http.ServerResponse ) => new HttpResponse( 200, "Hi there" ),
	delete 		: ( request: http.IncomingMessage, response: http.ServerResponse ) => new HttpResponse( 200, "Hi there" ),
}


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
		return new Promise<IServerResponseResult>( ( resolve : ( value: IServerResponseResult ) => void ) =>
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

			// Error Callback
			response.on('error', function( err : Error )
			{
						ServerResponses.EndResponseWithError( response, err, 400 );
				return ComUtils.ResolveWithError( "ServerResponses:UploadFile", err, resolve );
			});

			response.on( 'finish', function()
			{
				ServerResponses.EndResponseWithGoodResult( response );
				return ComUtils.ResolveWithGoodResult( Buffer.from( HTTPCodes[200] ), resolve );
			});

			// Content type and length
			response.setHeader( 'content-type', contentType );
			response.setHeader( 'content-length', sizeInBytes );

			// Pipe to file
			const readStream : fs.ReadStream =  fs.createReadStream( serverRequestInternalOptions.FileName );
			readStream.pipe( response );


		});
	}

	/** End the response with value passed with 'serverRequestInternalOptions' */
	public static async Request_GET( request : http.IncomingMessage, response : http.ServerResponse, serverRequestInternalOptions : IServerRequestInternalOptions ) : Promise<IServerResponseResult>
	{
		return new Promise<IServerResponseResult>( ( resolve : ( value: IServerResponseResult ) => void ) =>
		{
			response.on( 'error', ( err : Error ) =>
			{
				ServerResponses.EndResponseWithError( response, err, 400 );
				return ComUtils.ResolveWithError( "ServerResponses:Request_PUT", err, resolve );
			})
			response.on( 'finish', () =>
			{
				ServerResponses.EndResponseWithGoodResult( response );
				return ComUtils.ResolveWithGoodResult( Buffer.from( "DONE" ), resolve );
			});

			response.end( serverRequestInternalOptions.Value );
		});
	}

	/** Receive data storing them into buffer inside returne value body */
	public static async Request_PUT( request : http.IncomingMessage, response : http.ServerResponse, serverRequestInternalOptions : IServerRequestInternalOptions ) : Promise<IServerResponseResult>
	{
		return new Promise<IServerResponseResult>( ( resolve : ( value: IServerResponseResult ) => void ) =>
		{
			const body : any[] = [];

			// Error Callback
			request.on('error', function( err : Error )
			{
				ServerResponses.EndResponseWithError( response, err, 400 );
				return ComUtils.ResolveWithError( "ServerResponses:Request_GET", err, resolve );
			});

			request.on( 'data', function( chunk : any )
			{
				body.push( chunk );
			})
			
			request.on( 'end', function()
			{
				const result : Buffer = Buffer.concat( body );
				ServerResponses.EndResponseWithGoodResult( response );
				return ComUtils.ResolveWithGoodResult( result, resolve );
			});
		});
	}

}