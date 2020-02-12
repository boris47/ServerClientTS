
import * as http from 'http';
import * as fs from 'fs'
import * as path from 'path'
import * as mime from 'mime-types';

import { HTTPCodes } from './HTTP.Codes';
import { HttpResponse } from './HttpResponse';
import { IServerResponseResult } from '../Common/Interfaces';
import * as ComUtils from '../Common/ComUtils';
import * as FSUtils from '../Common/FSUtils';


/*
export type ServerReqResFunction = ( request : http.IncomingMessage, response : http.ServerResponse ) => HttpResponse;
*/
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
		post : ( request : http.IncomingMessage, response : http.ServerResponse ) => new HttpResponse( 405, `{ "codeMessage": "${HTTPCodes[405]}" }` ),
		delete : ( request : http.IncomingMessage, response : http.ServerResponse ) => new HttpResponse( 405, `{ "codeMessage": "${HTTPCodes[405]}" }` ),
		patch : ( request : http.IncomingMessage, response : http.ServerResponse ) => new HttpResponse( 405, `{ "codeMessage": "${HTTPCodes[405]}" }` ),
		get : ( request : http.IncomingMessage, response : http.ServerResponse ) => new HttpResponse( 405, `{ "codeMessage": "${HTTPCodes[405]}" }` ),
		put : ( request : http.IncomingMessage, response : http.ServerResponse ) =>
		{
			/*
			const filename = request.url.split('=')[1];
			let writer = fs.createWriteStream( filename )
			.on('error', ( err : Error ) =>
			{
				console.error( err.name, err.message );
                response.statusCode = 400;
				response.end();
			})

			request.on( 'error', ( err : Error ) =>
			{
				console.error( err.name, err.message );
				response.statusCode = 400;
				response.end();
			});
			request.on( 'data', ( chunk : any ) =>
			{
				writer.write( chunk );
			});
			request.on( 'end', () =>
			{
				writer.end();
				response.statusCode = 200;
				response.end();
			});
			*/
			const filename = request.url.split('=')[1];
			return new HttpResponse( 0, "",
			async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<IServerResponseResult> =>
			{
				return await ServerResponses.DownloadFile( request, response, filename );
			});
		}
	},

	'/download' : <IResponseMethods>
	{
		post : ( request : http.IncomingMessage, response : http.ServerResponse ) => new HttpResponse( 405, `{ "codeMessage": "${HTTPCodes[405]}" }` ),
		delete : ( request : http.IncomingMessage, response : http.ServerResponse ) => new HttpResponse( 405, `{ "codeMessage": "${HTTPCodes[405]}" }` ),
		patch : ( request : http.IncomingMessage, response : http.ServerResponse ) => new HttpResponse( 405, `{ "codeMessage": "${HTTPCodes[405]}" }` ),
		put : ( request : http.IncomingMessage, response : http.ServerResponse ) => new HttpResponse( 405, `{ "codeMessage": "${HTTPCodes[405]}" }` ),
		get : ( request : http.IncomingMessage, response : http.ServerResponse ) => 
		{
			/*
			const filename = request.url.split('=')[1];
			if ( fs.existsSync( filename ) )
			{
				return new HttpResponse( 200, fs.readFileSync( filename ) );
			}
			else
			{
				return new HttpResponse( 404, null );
			}
			*/
			const filename = request.url.split('=')[1];
			return new HttpResponse( 0, "",
			async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<IServerResponseResult> =>
			{
				return await ServerResponses.UploadFile( request, response, filename );
			});
		}
	},

};


ResponsesMap['/ping'] = {
	post 		:	( request: http.IncomingMessage, response: http.ServerResponse ) => new HttpResponse( 200, "Hi there" ),
	get 		:	( request: http.IncomingMessage, response: http.ServerResponse ) =>
	{
		return new HttpResponse( 0, "",
		async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<IServerResponseResult> =>
		{
			return await ServerResponses.Request_GET( request, response, "hi There" );
		});
	},
	put 		:	( request: http.IncomingMessage, response: http.ServerResponse ) => new HttpResponse( 200, "Hi there" ),
	patch 		:	( request: http.IncomingMessage, response: http.ServerResponse ) => new HttpResponse( 200, "Hi there" ),
	delete 		: ( request: http.IncomingMessage, response: http.ServerResponse ) => new HttpResponse( 200, "Hi there" ),
}


export class ServerResponses {


	private static EndResponseWithGoodResult( response : http.ServerResponse ) : void
	{
		response.statusCode = 200;
		response.end();
	}

	private static EndResponseWithError( response : http.ServerResponse, errMessage : string, errCode : number ) : void
	{
		response.statusCode = errCode;
		response.statusMessage = `${errMessage}`;
		response.end();
	}

	public static async DownloadFile( request : http.IncomingMessage, response : http.ServerResponse, fileName : string ) : Promise<IServerResponseResult>
	{
		return new Promise<IServerResponseResult>( ( resolve : ( value: IServerResponseResult ) => void ) =>
		{
			const writer = fs.createWriteStream( fileName )
			.on('error', ( err : Error ) =>
			{
                const msg = `${err.name}:${err.message}`;
				ServerResponses.EndResponseWithError( response, msg, 400 );
				return ComUtils.ResolveWithError( "ServerResponses:DownloadFile", msg, resolve );
			})

			request.on( 'error', ( err : Error ) =>
			{
				const msg = `${err.name}:${err.message}`;
				ServerResponses.EndResponseWithError( response, msg, 400 );
				return ComUtils.ResolveWithError( "ServerResponses:DownloadFile", msg, resolve );
			})
			.on( 'data', ( chunk : any ) => writer.write( chunk ) )
			.on( 'end', () =>
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
				const msg = `File ${fileName} doesn't exist`;
				ServerResponses.EndResponseWithError( response, msg, 400 );
				return ComUtils.ResolveWithError( "ServerResponses:UploadFile", msg, resolve );
			}

			// Check if content type can be found
			const contentType : string | false = mime.lookup( path.parse(fileName).ext );
			if ( contentType === false )
			{
				const msg = `Cannot define content type for file ${fileName}`;
				ServerResponses.EndResponseWithError( response, msg, 400 );
				return ComUtils.ResolveWithError( "ServerResponses:UploadFile", msg, resolve );
			}

			// Check file Size
			const bytes : number | null = FSUtils.GetFileSizeInBytesOf( fileName );
			if ( bytes === null )
			{
				const msg = `Cannot obtain size of file ${fileName}`;
				ServerResponses.EndResponseWithError( response, msg, 400 );
				return ComUtils.ResolveWithError( "ServerResponses:UploadFile", msg, resolve );
			}

			// Error Callback
			response.on('error', function( err : Error )
			{
				const msg = `${err.name}:${err.message}`;
				ServerResponses.EndResponseWithError( response, msg, 400 );
				return ComUtils.ResolveWithError( "ServerResponses:UploadFile", msg, resolve );
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


	public static async Request_GET( request : http.IncomingMessage, response : http.ServerResponse, data : any ) : Promise<IServerResponseResult>
	{
		return new Promise<IServerResponseResult>( ( resolve : ( value: IServerResponseResult ) => void ) =>
		{
			response.writeHead
			(
				/*statusCode*/ 200,
				/*headers*/ { 'Content-Type': 'application/json' }
			);

			// Error Callback
			response.on('error', function( err : Error )
			{
				const msg = `${err.name}:${err.message}`;
				ServerResponses.EndResponseWithError( response, msg, 400 );
				return ComUtils.ResolveWithError( "ServerResponses:Request_GET", msg, resolve );
			});
			
			response.on( 'finish', function()
			{
				ServerResponses.EndResponseWithGoodResult( response );
				return ComUtils.ResolveWithGoodResult( "Done", resolve );
			});

			response.end( data );
		});
	}


	public static async Request_PUT( request : http.IncomingMessage, response : http.ServerResponse, data : object ) : Promise<IServerResponseResult>
	{
		return new Promise<IServerResponseResult>( ( resolve : ( value: IServerResponseResult ) => void ) =>
		{
			const filename = request.url.split('=')[1];
			const writer = fs.createWriteStream( filename )
			.on('error', ( err : Error ) =>
			{
                const msg = `${err.name}:${err.message}`;
				ServerResponses.EndResponseWithError( response, msg, 400 );
				return ComUtils.ResolveWithError( "ServerResponses:DownloadFile", msg, resolve );
			})

			request.on( 'error', ( err : Error ) =>
			{
				const msg = `${err.name}:${err.message}`;
				ServerResponses.EndResponseWithError( response, msg, 400 );
				return ComUtils.ResolveWithError( "ServerResponses:DownloadFile", msg, resolve );
			})
			.on( 'data', ( chunk : any ) => writer.write( chunk ) )
			.on( 'end', () =>
			{
				writer.end();
				ServerResponses.EndResponseWithGoodResult( response );
				return ComUtils.ResolveWithGoodResult( "DONE", resolve );
			})
		});
	}

}