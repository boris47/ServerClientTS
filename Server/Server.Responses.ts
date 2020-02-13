
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
			const filename = request.url.split('=')[1];
			return new AsyncHttpResponse( async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<IServerResponseResult> =>
			{
				return await ServerResponses.DownloadFile( request, response, filename );
			});
		}
	},

	'/download' : <IResponseMethods>
	{
		get 	: ( request : http.IncomingMessage, response : http.ServerResponse ) => 
		{
			const filename = request.url.split('=')[1];
			return new AsyncHttpResponse( async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<IServerResponseResult> =>
			{
				return await ServerResponses.UploadFile( request, response, filename );
			});
		}
	},

	'/data' : <IResponseMethods>
	{
		get		: ( request : http.IncomingMessage, response : http.ServerResponse ) => 
		{
			const key = request.url.split('=')[1];
			return new AsyncHttpResponse( async ( request, response ) : Promise<IServerResponseResult> =>
			{
				const value = ServerStorage.HasEntry( key ) ? ServerStorage.GetEntry( key ) : null;
				return await ServerResponses.Request_GET( request, response, key );
			});
		},
		put 	: ( request : http.IncomingMessage, response : http.ServerResponse ) =>
		{
			const key = request.url.split('=')[1];
			return new AsyncHttpResponse( async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<IServerResponseResult> =>
			{
				const result : IServerResponseResult = await ServerResponses.Request_PUT( request, response );
				ServerStorage.AddEntry( key, result.body );
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
				ComUtils.ResolveWithGoodResult( "Hi there", resolve );
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

	
	public static async DownloadFile( request : http.IncomingMessage, response : http.ServerResponse, fileName : string ) : Promise<IServerResponseResult>
	{
		return new Promise<IServerResponseResult>( ( resolve : ( value: IServerResponseResult ) => void ) =>
		{
			const writer = fs.createWriteStream( fileName )
			.on('error', ( err : Error ) =>
			{
				ServerResponses.EndResponseWithError( response, err, 400 );
				return ComUtils.ResolveWithError( "ServerResponses:DownloadFile", err, resolve );
			})

			request.on( 'error', ( err : Error ) =>
			{
				ServerResponses.EndResponseWithError( response, err, 400 );
				return ComUtils.ResolveWithError( "ServerResponses:DownloadFile", err, resolve );
			});
			request.on( 'data', ( chunk : any ) => writer.write( chunk ) );
			request.on( 'end', () =>
			{
				writer.end();
				ServerResponses.EndResponseWithGoodResult( response );
				return ComUtils.ResolveWithGoodResult( "DONE", resolve );
			})
		});
	}


	public static async UploadFile( request : http.IncomingMessage, response : http.ServerResponse, fileName : string ) : Promise<IServerResponseResult>
	{
		return new Promise<IServerResponseResult>( ( resolve : ( value: IServerResponseResult ) => void ) =>
		{
			// Check if file exists
			if ( fs.existsSync( fileName ) === false )
			{
				const err = `File ${fileName} doesn't exist`;
				ServerResponses.EndResponseWithError( response, err, 400 );
				return ComUtils.ResolveWithError( "ServerResponses:UploadFile", err, resolve );
			}

			// Check if content type can be found
			const contentType : string | false = mime.lookup( path.parse(fileName).ext );
			if ( contentType === false )
			{
				const err = `Cannot define content type for file ${fileName}`;
				ServerResponses.EndResponseWithError( response, err, 400 );
				return ComUtils.ResolveWithError( "ServerResponses:UploadFile", err, resolve );
			}

			// Check file Size
			const bytes : number | null = FSUtils.GetFileSizeInBytesOf( fileName );
			if ( bytes === null )
			{
				const err = `Cannot obtain size of file ${fileName}`;
				ServerResponses.EndResponseWithError( response, err, 400 );
				return ComUtils.ResolveWithError( "ServerResponses:UploadFile", err, resolve );
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
				return ComUtils.ResolveWithGoodResult( "Done", resolve );
			});

			// Content type and length
			response.setHeader( 'content-type', contentType );
			response.setHeader( 'content-length', bytes );

			// Pipe to file
			const readStream : fs.ReadStream =  fs.createReadStream( fileName );
			readStream.pipe( response );


		});
	}


	public static async Request_GET( request : http.IncomingMessage, response : http.ServerResponse, key : string ) : Promise<IServerResponseResult>
	{
		return new Promise<IServerResponseResult>( ( resolve : ( value: IServerResponseResult ) => void ) =>
		{
			const value = ServerStorage.GetEntry( key );
			if ( !value )
			{
				const err = `Storage does not contains any entry with key "${key}"`;
				ServerResponses.EndResponseWithError( response, err, 400 );
				return ComUtils.ResolveWithError( "ServerResponses:Request_PUT", err, resolve );
			}

			response.on( 'error', ( err : Error ) =>
			{
				ServerResponses.EndResponseWithError( response, err, 400 );
				return ComUtils.ResolveWithError( "ServerResponses:Request_PUT", err, resolve );
			})
			response.on( 'finish', () =>
			{
				ServerResponses.EndResponseWithGoodResult( response );
				return ComUtils.ResolveWithGoodResult( "DONE", resolve );
			});

			response.end( value );
		});
	}


	public static async Request_PUT( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<IServerResponseResult>
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
				const result : string = Buffer.concat( body ).toString();
				ServerResponses.EndResponseWithGoodResult( response );
				return ComUtils.ResolveWithGoodResult( result, resolve );
			});
		});
	}

}