
import * as http from 'http';
import * as net from 'net';
import * as https from 'https';
import * as fs from 'fs';

import { server as WebSocketServer, IServerConfig, connection as WebSocketConnection, request as WebSocketRequest, IMessage } from 'websocket';

import  * as GenericUtils from '../Common/GenericUtils';
import { IServerInfo } from '../Common/Interfaces';
import { AsyncHttpResponse } from './HttpResponse';
import { IResponseMethods, ResponsesMap, MethodNotAllowed, NotImplementedResponse } from './Server.ResponsesMap';
import { ServerStorage } from './Server.Storage';

export interface IServerRequestResponsePair {

	request : http.IncomingMessage;
	
	response : http.ServerResponse;
}

const ConnectedClients = new Array<WebSocketConnection>();



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

	const server : http.Server = http.createServer( serverOptions );
	{
		server.on( 'error', function( err : Error )
		{
			console.error( err.name, err.message );
			bResult = false;
		})
		
		server.on('request', ( request : http.IncomingMessage, response : http.ServerResponse ) =>
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

		server.listen( listenOptions, () =>
		{
			console.log( `Node server created at localhost, port:3000\n` );
		});
}

	// Web socket server setup
	{
		const IsOriginAllowed = ( origin : string ) : boolean =>
		{
			return true;
		}

		const serverConfig = <IServerConfig>
		{
			httpServer : /*server*/ http.createServer().listen( 3001, '::' ),

		//	autoAcceptConnections : false
		}
		const webSocketServer = new WebSocketServer( serverConfig );
		{
			webSocketServer.on( 'connect', ( connection: WebSocketConnection ) =>
			{

			});

			webSocketServer.on( 'close', ( connection: WebSocketConnection, reason: number, desc: string ) =>
			{

			});

			webSocketServer.on( 'request', ( request: WebSocketRequest ) =>
			{
				console.log( `${new Date()} Connection from origin ${request.origin}.` );

				if ( !IsOriginAllowed( request.origin ) )
				{
					request.reject();
					console.log( `${new Date()} Connection from origin ${request.origin} rejected.` );
					return;
				}

				console.log( `${new Date()} Connection accepted.` );
				const connection : WebSocketConnection = request.accept( 'echo-protocol', request.origin );
				ConnectedClients.push( connection );

				connection.on('error', ( err: Error ) =>
				{
					console.error( `Connection Error: "${err.name}:${err.message}"` );
				});

				connection.on( 'close', ( code: number, desc: string ) =>
				{
					console.log( `${new Date()} Peer ${connection.remoteAddress} disconnected` );
					ConnectedClients.splice( ConnectedClients.indexOf(connection), 1 );
				});

				connection.on( 'message', ( data: IMessage ) =>
				{
					let buffered : Buffer = null;
					switch( data.type )
					{
						case 'utf8' :
						{
							buffered = Buffer.from( data.utf8Data );
							console.log("Received: '" + data.utf8Data + "'");
							connection.close();
							break;
						}
						case 'binary' :
						{
							buffered = Buffer.from( data.binaryData );
							break;
						}
					}
				});
			});
		}

	}



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