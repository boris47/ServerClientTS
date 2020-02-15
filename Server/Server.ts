
import * as http from 'http';
import * as fs from 'fs';
import * as os from 'os';

import  * as GenericUtils from '../Common/GenericUtils';
import { IServerInfo } from '../Common/Interfaces';
import { HttpResponse, AsyncHttpResponse } from './HttpResponse';
import { IResponseMethods, ResponsesMap, MethodNotAllowed, NotImplementedResponse } from './Server.ResponsesMap';
import { ServerStorage } from './Server.Storage';

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
.listen( 3000, '::', function()
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
	const availableMethods : IResponseMethods = ResponsesMap[identifier];
	if ( availableMethods )
	{
		const method : () => AsyncHttpResponse = availableMethods[request.method.toLowerCase()];
		if ( method )
		{
			const result = await method().applyToResponse( request, response );
			console.log( `Request: ${request.url}, response sent.\nResult: ${result.bHasGoodResult}` );
		}
		else // Method Not Allowed
		{
			const result = await MethodNotAllowed.applyToResponse( request, response );
			console.log( `Request: ${request.url}, response sent.\nResult: ${result.bHasGoodResult}` );
		}
	}
	else
	{
		const result = await NotImplementedResponse.applyToResponse( request, response );
		console.log( `Request: ${request.url}, response sent.\nResult: ${result.bHasGoodResult}` );
	}
}


async function UploadConfigurationFile() : Promise<boolean>
{
	const fileName = "./ServerCfg.json";
	const serverData : IServerInfo = <IServerInfo>{};

	const res = require('os').networkInterfaces();
	const filtered : string = Object.keys( res )
	.map( ( value : string ) => res[value] )
	.find( ( value: os.NetworkInterfaceInfo[] ) => value.some( ( value: os.NetworkInterfaceInfo ) => typeof value['scopeid'] === 'number' ))
	.find( ( value: os.NetworkInterfaceInfo ) => ( value: os.NetworkInterfaceInfo ) => typeof value['scopeid'] === 'number' ).address;
//	console.log( JSON.stringify( res, null, 4 ) );
	console.log( "Server IP", filtered );


	const publicIp : string | null = await new Promise( ( resolve ) =>
	{
		http.get( /*'http://bot.whatismyipaddress.com'*/'http://ifconfig.me/ip', function( response : http.IncomingMessage )
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
	return !!publicIp;
}

async function Main()
{
	{
		await ServerStorage.ClearStorage();
		await ServerStorage.CreateStorage();
		const bResult = await ServerStorage.Load();
		if ( !bResult )
		{
			console.error( "Storage unavailable" );
			process.exit(1);
		}
	}

	{
		const bResult = await UploadConfigurationFile();
		if ( !bResult )
		{
			console.error( "Cannot public current ip" );
			process.exit(1);
		}
	}

	{
		while( true )
		{
			await GenericUtils.DelayMS( 1000 );
	
			await ProcessRequest();
		}
	}
}

Main();
