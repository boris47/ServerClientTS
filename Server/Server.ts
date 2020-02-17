
import * as http from 'http';
import * as net from 'net';
import * as https from 'https';
import * as fs from 'fs';
import * as os from 'os';

import  * as GenericUtils from '../Common/GenericUtils';
import { IServerInfo } from '../Common/Interfaces';
import { AsyncHttpResponse } from './HttpResponse';
import { IResponseMethods, ResponsesMap, MethodNotAllowed, NotImplementedResponse } from './Server.ResponsesMap';
import { ServerStorage } from './Server.Storage';

export interface IServerRequestResponsePair {

	request : http.IncomingMessage;
	
	response : http.ServerResponse;
}



const requestToProcess = new Array<IServerRequestResponsePair>();

function GetDiffMillisecondsStr( startTime : number, currentTime : number ) : string
{
	const diff = currentTime - startTime;
	return diff.toString();
}

function ReportResponseResult( request : http.IncomingMessage, value : any, startTime : number ) : void
{
	console.log( [
		`Request: ${request.url}`,
		`Result: ${value.bHasGoodResult}`,
		`Time: ${GetDiffMillisecondsStr(startTime, Date.now())}ms`,
		''
	].join('\n') );
}

async function CreateServer() : Promise<boolean>
{
	let bResult = true;

	const serverOptions  = <http.ServerOptions>
	{

	};

	const listenOptions = <net.ListenOptions>
	{
		port : 3000,
		host : '::'
	}

	const server : http.Server = http.createServer( serverOptions )

	.on( 'error', function( err : Error )
	{
		console.error( err.name, err.message );
		bResult = false;
	})
	
	.on('request', ( request : http.IncomingMessage, response : http.ServerResponse ) =>
	{
		const startTime = Date.now();
		const identifier : string = request.url.split('?')[0];
		const availableMethods : IResponseMethods = ResponsesMap[identifier];
		if ( availableMethods )
		{
			const method : () => AsyncHttpResponse = availableMethods[request.method.toLowerCase()];
			if ( method )
			{
				method().applyToResponse( request, response ).then( ( value ) => ReportResponseResult( request, value, startTime ) );
			}
			else // Method Not Allowed
			{
				MethodNotAllowed.applyToResponse( request, response ).then( ( value ) => ReportResponseResult( request, value, startTime ) );
			}
		}
		else
		{
			NotImplementedResponse.applyToResponse( request, response ).then( ( value ) => ReportResponseResult( request, value, startTime ) );
		}
	})

	.listen( listenOptions, () =>
	{
		console.log( `Node server created at localhost, port:3000\n` );
	});
	return bResult;
}

async function UploadConfigurationFile() : Promise<boolean>
{
	const fileName = "./ServerCfg.json";
	const serverData : IServerInfo = <IServerInfo>{};
/*
	const res = require('os').networkInterfaces();
	const filtered : string = Object.keys( res )
	.map( ( value : string ) => res[value] )
	.find( ( value: os.NetworkInterfaceInfo[] ) => value.some( ( value: os.NetworkInterfaceInfo ) => typeof value['scopeid'] === 'number' ))
	.find( ( value: os.NetworkInterfaceInfo ) => ( value: os.NetworkInterfaceInfo ) => typeof value['scopeid'] === 'number' ).address;
//	console.log( JSON.stringify( res, null, 4 ) );
	console.log( "Server IP", filtered );
*/

	const publicIp : string | null = await new Promise( ( resolve ) =>
	{
		https.get( 'https://bot.whatismyipaddress.com/'/*'http://ifconfig.me/ip'*/ /*'https://api6.ipify.org/'*/, function( response : http.IncomingMessage )
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
		await ServerStorage.CreateStorage();
		const bResult = await ServerStorage.Load();
		if ( !bResult )
		{
			console.error( "Storage unavailable" );
			process.exit(1);
		}
	}

	{
		const publicIp = await UploadConfigurationFile();
		if ( !publicIp )
		{
			console.error( "Cannot public current ip" );
			process.exit(1);
		}
	}

	{	
		const bResult = await CreateServer();
		if ( !bResult )
		{
			console.error( "Cannot create server" );
			process.exit(1);
		}
	}

	{
		while( true )
		{
			await GenericUtils.DelayMS( 1000 );
	
			await ServerStorage.Save();
		}
	}

}

Main();




/*
import * as ws from 'ws'

const server = http.createServer();
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', function connection(ws, request, client) {
  ws.on('message', function message(msg) {
    console.log(`Received message ${msg} from user ${client}`);
  });
});

server.on('upgrade', function upgrade(request, socket, head) {
  authenticate(request, (err, client) => {
    if (err || !client) {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit('connection', ws, request, client);
    });
  });
});

server.listen(8080);
*/
