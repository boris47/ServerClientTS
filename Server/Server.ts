
import * as http from 'http';
import * as fs from 'fs'

import  * as GenericUtils from '../Common/GenericUtils';
import { IServerInfo } from '../Common/Interfaces';
import { HttpResponse } from './HttpResponse';
import { ResponsesMap, IResponseMethods } from './Server.Responses';

export interface IServerRequestResponsePair {

	request : http.IncomingMessage;
	
	response : http.ServerResponse;
}



const requestToProcess : IServerRequestResponsePair[] = new Array<IServerRequestResponsePair>();



const server : http.Server = http.createServer( ( request : http.IncomingMessage, response : http.ServerResponse ) =>
{
	const newPair = <IServerRequestResponsePair>
	{
		request : request,
		response : response
	};
	requestToProcess.push( newPair );
})
.on( 'error', function( err : Error )
{
	console.error( err.name, err.message );
})
.listen( 3000, '0.0.0.0', function()
{
	console.log('Node server created at 0.0.0.0:3000');
});





async function ProcessRequest()
{
	if ( requestToProcess.length === 0 )
		return;

	const pair : IServerRequestResponsePair = requestToProcess.shift();
	const request : http.IncomingMessage = pair.request;
	const response : http.ServerResponse = pair.response;

	const identifier : string = request.url.split('?')[0];
	if ( ResponsesMap[identifier] )
	{
		const responseMethodsMap : IResponseMethods = ResponsesMap[identifier];
		if ( responseMethodsMap )
		{
			const func = responseMethodsMap[request.method.toLowerCase()];
			if ( func )
			{
				const intermediate : HttpResponse = func( request, response );
				if ( intermediate )
				{
					const result = await intermediate.applyToResponse( request, response );
					console.log( `Request: ${request.url}, response sent.` );
					console.log( JSON.stringify( result, null, 4 ) );
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
		.on( "error", function( err: Error )
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
		console.log( "Server", 'publicIp', publicIp );
		serverData.ServerIp = publicIp;
		fs.writeFileSync( fileName, JSON.stringify( serverData, null, '\t' ) );		
	}
}

async function Main()
{
	UploadConfigurationFile();

	while( true )
	{
		await GenericUtils.DelayMS( 1000 );

		await ProcessRequest();
	}
}

Main();
