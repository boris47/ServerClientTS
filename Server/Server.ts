
import http = require('http');
import * as fs from 'fs'

import { IServerInfo } from '../Common/Interfaces'

const delay = ( ms : number = 1000 ) => {
    return new Promise( (resolve, reject) => {
        setTimeout (() => {
            resolve(1);
        }, ms);
    });
};

const requestToProcess : Array<http.IncomingMessage> = new Array();
const responseToProcess : Array<http.ServerResponse> = new Array();

const requestListener : http.RequestListener = ( request : http.IncomingMessage, response : http.ServerResponse ) =>
{
	requestToProcess.push( request );
	responseToProcess.push( response );

//	response.writeHead(200, { 'Content-Type': 'text/plain' });
//	response.end('okay');
	
//	response.writeHead(200, { 'Content-Type': 'application/json' });
//	response.write('{ "data": "Sono roberto" }');
//	response.end();
}
const server = http.createServer( requestListener );


server.on('error', (err) => console.error(err));
/*
server.on('request',(request,response)=>{
	response.writeHead(200,{'Content-Type':'text/plain'});
	response.write('Hello world');
	response.end();
 });
*/
server.listen(
	3000,
	'0.0.0.0'
//	'ec2-3-122-195-167.eu-central-1.compute.amazonaws.com',
/*	() => {
		console.log('Node server created at 127.0.0.1:3000');
	}
*/);


class HttpResponse {

	private code : number = 0;
	private body : string = null;
	private headers : any[] = new Array<any>();

	constructor( code : number, body : string, headers = [] )
	{
        this.headers = headers
        this.body = body
        this.code = code
    }

	applyToResponse( request : http.IncomingMessage, response : http.ServerResponse )
	{
		response.statusCode = this.code;
		this.headers.forEach( h => response.setHeader( h.name, h.value ) );
	//	if (request.headers['origin'])
	//		response.setHeader('Access-Control-Allow-Origin', request.headers['origin'])
	//	response.setHeader('Access-Control-Allow-Credentials', 'true')
	//	response.setHeader('Access-Control-Allow-Headers', 'x-identity-key, x-identity-key-name, x-pw, x-token')
		response.end(this.body);
    }

}

export type ServerReqResFunction = ( request : http.IncomingMessage, response : http.ServerResponse ) => HttpResponse;

export interface IResponseMethods {
	post? 		: ( request : http.IncomingMessage, response : http.ServerResponse ) => HttpResponse;
	get? 		: ( request : http.IncomingMessage, response : http.ServerResponse ) => HttpResponse;
	put? 		: ( request : http.IncomingMessage, response : http.ServerResponse ) => HttpResponse;
	patch? 		: ( request : http.IncomingMessage, response : http.ServerResponse ) => HttpResponse;
	delete? 	: ( request : http.IncomingMessage, response : http.ServerResponse ) => HttpResponse;
}

export interface ServerResponceMap {
	[key:string] : IResponseMethods
}

const ResponsesMap : ServerResponceMap = {

	'/test1' : <IResponseMethods>
	{
		get : ( request : http.IncomingMessage, response : http.ServerResponse ) => new HttpResponse( 200, '{ "bStatusOK": true, "data":"test1 received" }' ),
		put : ( request : http.IncomingMessage, response : http.ServerResponse ) =>
		{
			let data = "";
			request.on('data', (chunk : any) =>
			{
                data += (chunk);
			})
			.on('end', () =>
			{
				console.log( "end", data );
			});
		}
	},
	'/test2' : <IResponseMethods>
	{
		get : ( request : http.IncomingMessage, response : http.ServerResponse ) => new HttpResponse( 200, '{ "bStatusOK": true, "data":"test2 received" }' ),
	},
	'/test3' : <IResponseMethods>
	{
		get : ( request : http.IncomingMessage, response : http.ServerResponse ) => new HttpResponse( 200, '{ "bStatusOK": true, "data":"test3 received" }' ),
	},
	'/uploadImage' : <IResponseMethods>
	{
		put: ( request : http.IncomingMessage, response : http.ServerResponse ) =>
		{

		}
	}
};

ResponsesMap['/greetings'] = {
	get : ( request: http.IncomingMessage, response: http.ServerResponse ) => new HttpResponse( 200, "Good morning" )
}


async function ProcessRequest()
{
	if ( requestToProcess.length === 0 )
		return;

	const request : http.IncomingMessage = requestToProcess.shift()
	const response : http.ServerResponse = responseToProcess.shift();

	response.writeHead
	(
		/*statusCode*/ 200,
		/*headers*/ { 'Content-Type': 'application/json' }
	);

	const identifier : string = request.url.split('?')[0];
	if ( ResponsesMap[identifier] )
	{
		const responseMethodsMap : IResponseMethods = ResponsesMap[identifier];
		if ( responseMethodsMap )
		{
			const func : ServerReqResFunction = responseMethodsMap[request.method.toLowerCase()];
			if ( func )
			{
				const result : HttpResponse = func( request, response );
				if ( result )
				{
					result.applyToResponse( request, response );
					console.log( `Request: ${request.url}, response sent.` );
				}
			}
		}
	}
	else
	{
		response.end('{ "bStatusOK": false }');
	}
}




async function UploadConfigurationFile()
{
	const fileName = "./ServerCfg.json";
	const serverData : IServerInfo = <IServerInfo>{};

	const publicIp : string | null = await new Promise( ( resolve ) =>
	{
		http.get( 'http://bot.whatismyipaddress.com', function( response : http.IncomingMessage )
		{
			let rawData = "";
			response
			.on('data', function( chunk : any )
			{
				rawData += chunk;
			})
			.on('end', function()
			{
				resolve( rawData );
			})
			.on( "error", function( err: Error )
			{
				console.error( "Server", err.name, err.message );
				resolve(null);
			})
		})
		.on("error", function( err: Error )
		{
			console.error( "Server", err.name, err.message );
			resolve(null);
		});
	});

	if ( !publicIp )
	{
		console.error( "Server", "Cannot retrieve public ip" );
	}
	else
	{
		console.log( 'publicIp', publicIp );
		serverData.ServerIp = publicIp;
		fs.writeFileSync( fileName, JSON.stringify( serverData, null, '\t' ) );		
	}
}

async function Main()
{
	UploadConfigurationFile();

	while( true )
	{
		await delay();

		await ProcessRequest();
	}
}

Main();
