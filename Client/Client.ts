
import http = require('http');
import * as fs from 'fs';
import { IServerInfo } from '../Common/Interfaces'

const delay = ( ms : number = 1000 ) => {
    return new Promise( (resolve, reject) => {
        setTimeout (() => {
            resolve(1);
        }, ms);
    });
};


async function DoRequest( options: http.RequestOptions, method : string = "get" ) : Promise<string | null>
{
	return new Promise<string | null>( (resolve) =>
	{
		http.request
		(
			Object.assign
			(
				options,
				<http.RequestOptions>
				{
					method: method
				}
			),
			function( response: http.IncomingMessage )
			{
				const statusCode : number = response.statusCode;
				const contentType : string = response.headers['content-type'];
				{
					if ( statusCode !== 200 )
					{
						console.error( 'Request Failed.\n' +	`Status Code: ${statusCode}` );
						// Consume response data to free up memory
						resolve( null );
					}

					const bIsContentJSON = (/^application\/json/).test(contentType.toLowerCase());
					const bIsContentTEXT = (/^text\/plain/).test(contentType.toLowerCase());
					if ( bIsContentJSON || bIsContentTEXT )
					{
						let rawData = "";
						response.setEncoding('utf8')
						.on( 'data', function( chunk : any )
						{
							rawData += chunk;
						})
						.on( 'end', function()
						{
							resolve(rawData);
						});
					}
					else
					{
						resolve("{}");
					}
				}
			}
		)
		.on('error', function( e : Error )
		{
			console.error( e.message );
			resolve( null );
		})
		.end();
	});
};

async function SendData( options: http.RequestOptions, method : string = "put" ) : Promise<boolean>
{
	return new Promise<boolean>( (resolve) =>
	{
		http.request
		(
			Object.assign
			(
				options,
				<http.RequestOptions>
				{
					method: method
				}
			),
			function( response: http.IncomingMessage )
			{
				
				resolve(true);
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

interface ClientRequest {
	path : string,
}

const requestToProcess : Array<ClientRequest> = new Array();


async function ProcessRequest()
{
	if ( requestToProcess.length === 0 )
	{
		return process.exit(0);
	}

	const request : ClientRequest = requestToProcess.shift();
	const result : string | null = await DoRequest( Object.assign({}, CommonOptions, request ) );
	if ( result )
	{
		console.log("request satisfied for " + result );
	}
	else
	{
		console.error( "failed request", request.path );
	}

}

function AddRequest( path : string = 'none' )
{
	const newRequest : ClientRequest = {
		path : path
	};

	requestToProcess.push( newRequest );
}

async function Main()
{
	while( true )
	{
		await delay();
		await ProcessRequest();
	}
}

AddRequest('/greetings');
AddRequest('/test1');
AddRequest('/test2');
AddRequest('/test3');

Main();





