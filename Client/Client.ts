
//import http = require('http');
import * as http from 'http';
import * as fs from 'fs';

import * as FSUtils from '../Common/FSUtils'
import { IServerInfo } from '../Common/Interfaces'
import * as mime from 'mime-types'
import { Stream } from 'stream';

const delay = ( ms : number = 1000 ) => {
    return new Promise( (resolve, reject) => {
        setTimeout (() => {
            resolve(1);
        }, ms);
    });
};

async function Request_GET( options: http.RequestOptions ) : Promise<string | null>
{
	return new Promise<string | null>( (resolve) =>
	{
		http.request
		(
			options,
			function( response: http.IncomingMessage )
			{
				const statusCode : number = response.statusCode;
				if ( statusCode !== 200 )
				{
					console.error( 'Request Failed.\n' +	`Status Code: ${statusCode}` );
					// Consume response data to free up memory
					return resolve( null );
				}

				let rawData = new Array<any>();
				response
				.on( 'data', ( chunk : any ) => rawData.push( chunk ))
				.on( 'end', () => resolve( Buffer.concat( rawData ).toString() ) );
			}
		)
		.on('error', function( e : Error )
		{
			console.error( e.message );
			resolve( null );
		})
		.end();
	});
}


async function Request_PUT( options: http.RequestOptions ) : Promise<string | null>
{
	const filename = options.path.split('=')[1];
	const bytes : number = await FSUtils.GetFileSizeInBytesOf( filename );

	return new Promise<string | null>( (resolve) =>
	{
		const request : http.ClientRequest = http.request( options );
		
		// Content type and length
		const contentType : string = mime.lookup( filename ).toString();
		request.setHeader( 'content-type', contentType );
		request.setHeader( 'content-length', bytes );

		// Response Check
		request.on( 'response', function( response: http.IncomingMessage )
		{
			const statusCode : number = response.statusCode;
			if ( statusCode !== 200 )
			{
				console.error( 'Request Failed.\n' +	`Status Code: ${statusCode}` );
				return resolve( null );
			}
			console.log( "File submitted", filename );
		} )

		// Error Callback
		request.on('error', function( err : Error )
		{
			console.error( err.message );
			resolve( null );
		});

		request.on( 'pipe', function( src : fs.ReadStream )
		{
			console.log( "PUT", filename, contentType, bytes );
		})
		request.on( 'drain', function()
		{
			console.log('DRAIN');
		})
		request.on( 'finish', function()
		{
			console.log( "PUT", filename, contentType, bytes, "DONE" );
		})
		

		// Pipe to file
		const readStream : fs.ReadStream =  fs.createReadStream( filename )
		readStream.pipe( request );
	});
}


let serverPublicIp = "";
const serverConfigFileName = './ServerCfg.json';
if ( fs.existsSync( serverConfigFileName ) )
{
	const fileContent = fs.readFileSync( serverConfigFileName, 'UTF-8' );
	const fileJson : IServerInfo = JSON.parse( fileContent );
	serverPublicIp = fileJson.ServerIp;
}



const CommonOptions : http.RequestOptions = {
	host: `${serverPublicIp}`,
	port: 3000,
	timeout : 500,
};

interface IClientRequest {
	path : string,
	method : string
}

const requestsToProcess : Array<IClientRequest> = new Array<IClientRequest>();

async function ProcessRequest()
{
	if ( requestsToProcess.length === 0 )
	{
		return process.exit(0);
	}

	let requestFunction : ( options: http.RequestOptions) => Promise<string> = null;
	const request : IClientRequest = requestsToProcess.shift();
	switch( request.method )
	{
		case 'get' :
		{
			requestFunction = Request_GET;
			break;
		}
		case 'put' :
		{
			requestFunction = Request_PUT;
			break;	
		}
	}


	const result : string | null = await requestFunction( Object.assign({}, CommonOptions, request ) );
	if ( result )
	{
		console.log("request satisfied for " + result );
	}
	else
	{
		console.error( "failed request", request.path );
	}

}

function AddRequest( path : string, method : string )
{
	if ( typeof path === 'string' )
	{
		const newRequest : IClientRequest = {
			path : path,
			method : method.toLowerCase()
		};
		requestsToProcess.push( newRequest );
	}
}

async function Main()
{
	while( true )
	{
		await delay();
		await ProcessRequest();
	}
}

AddRequest( '/ping', 'get' );
AddRequest( '/upload?file=ClientManyBytes.js', 'put' );


Main();





