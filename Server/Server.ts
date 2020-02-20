
import * as http from 'http';
import * as net from 'net';
import * as https from 'https';
import * as fs from 'fs';

import { server as WebSocketServer, IServerConfig, connection as WebSocketConnection, request as WebSocketRequest, IMessage } from 'websocket';

import  * as GenericUtils from '../Common/GenericUtils';
import { AsyncHttpResponse } from './HttpResponse';
import { IResponseMethods, ResponsesMap, MethodNotAllowed, NotImplementedResponse } from './Server.ResponsesMap';
import { ServerStorage } from './Server.Storage';
import { ServerConfigs } from './Server.Configs';




const ConnectedClients = new Array<WebSocketConnection>();

const serverConfigs = new ServerConfigs();



async function CreateServer() : Promise<boolean>
{
	const reportResponseResult = ( request : http.IncomingMessage, value : any, startTime : number ) : void =>
	{
		const getDiffMillisecondsStr = ( startTime : number, currentTime : number ) : string =>
		{
			const diff = currentTime - startTime;
			return diff.toString();
		};
		console.log( [
			`Request: ${request.url}`,
			`Result: ${value.bHasGoodResult}`,
			`Time: ${getDiffMillisecondsStr(startTime, Date.now())}ms`,
			''
		].join('\n') );
	};


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
					method().applyToResponse( request, response ).then( ( value ) => reportResponseResult( request, value, startTime ) );
				}
				else // Method Not Allowed
				{
					MethodNotAllowed.applyToResponse( request, response ).then( ( value ) => reportResponseResult( request, value, startTime ) );
				}
			}
			else
			{
				NotImplementedResponse.applyToResponse( request, response ).then( ( value ) => reportResponseResult( request, value, startTime ) );
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

async function HTTP_Get( url : string ) : Promise<string | null>
{
	return await new Promise<string | null>( ( resolve ) =>
	{
		const request = https.get( url, function( response : http.IncomingMessage )
		{
			let rawData = "";
			response.on('data', function( chunk : any )
			{
				rawData += chunk;
			});

			response.on('end', function()
			{
				resolve( rawData.trim() );
			});

			response.on( "error", function( err: Error )
			{
				console.error( "HTTP_Get:\t", err.name, err.message );
				resolve( null );
			})
		});

		request.on( "error", function( err: Error )
		{
			console.error( "HTTP_Get:\t", err.name, err.message );
			resolve( null );
		});
	})
}

async function UploadConfigurationFile() : Promise<boolean>
{
	let bResult = true;
	const url_v6 = 'https://ipv6-api.speedtest.net/getip';
	const url_v4 = 'https://ipv4-api.speedtest.net/getip';
	const publicIPv6 : string | null = await HTTP_Get( url_v6 );
	const publicIPv4 : string | null = await HTTP_Get( url_v4 );
	
	if ( publicIPv6 )
	{
		console.log( "Server", 'publicIP', publicIPv6 );
		serverConfigs.SetCurrentPublicIP( publicIPv6 );
	}
	else if ( publicIPv4 )
	{
		console.log( "Server", 'publicIP', publicIPv4 );
		serverConfigs.SetCurrentPublicIP( publicIPv4 );
	}
	else
	{
		console.error( `Cannot retrieve public ip` );
		bResult = false;
	}
	
	if ( bResult )
	{
		const fileName = "./ServerCfg.json";
		fs.writeFileSync( fileName, JSON.stringify( serverConfigs, null, '\t' ) );
	}

	bResult = bResult && serverConfigs.IsValid();

	return bResult;
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
			console.error( "Cannot retrieve public ip" );
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