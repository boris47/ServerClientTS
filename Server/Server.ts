
import * as http from 'http';
import * as net from 'net';
import * as fs from 'fs';

import {
	server as WebSocketServer,
	IServerConfig,
	connection as WebSocketConnection,
	request as WebSocketRequest, IMessage
} from 'websocket';

import  * as GenericUtils from '../Common/GenericUtils';
import * as ComUtils from '../Common/ComUtils';
import { AsyncHttpResponse } from './HttpResponse';
import { IResponseMethods, ResponsesMap, MethodNotAllowed, NotImplementedResponse } from './Server.ResponsesMap';
import { StorageManager, EStorageType } from './Server.Storages';
import { ServerConfigs } from './Server.Configs';

import { AWSUtils } from './Utils/AWSUtils';
import { MongoDatabase } from './Utils/MongoDatabase';
import { UniqueID } from '../Common/GenericUtils';
import { HTTPCodes } from './HTTP.Codes';

import { Logger } from '../Common/Logger';
import { ProcessContainer } from '../Common/ProcessContainer';

// Very simple answer
process.on( 'message', ( message : any ) =>
{
	if ( message === 'update' )
	{
		process.send( <ProcessContainer.Fork.ISubProcessMessage>
		{
			processName : 'Server',
			msg : "Ciao mamma",
			msgType : message
		});
	}
});


const ConnectedClients = new Array<WebSocketConnection>();


async function CreateServer() : Promise<boolean>
{
	const reportResponseResult = ( request : http.IncomingMessage, value : any, startTime : number ) : void =>
	{
		const getDiffMillisecondsStr = ( startTime : number, currentTime : number ) : string =>
		{
			const diff = currentTime - startTime;
			return diff.toString();
		};
		console.log( [ `Request: ${request.url}`, `Result: ${value.bHasGoodResult}`, `Time: ${getDiffMillisecondsStr(startTime, Date.now())}ms`, '' ].join('\n') );
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
			console.log( `Node server created at localhost, port:3000` );
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
			httpServer : /*server*/ http.createServer().listen( 3001, '::', () => console.log( `WebSocket Server created at localhost, port:3001\n` ) ),

		//	autoAcceptConnections : false
		}
		const webSocketServer = new WebSocketServer( serverConfig );
		{		
	//		webSocketServer.on( 'connect', ( connection: WebSocketConnection ) => {});
	//		webSocketServer.on( 'close', ( connection: WebSocketConnection, reason: number, desc: string ) =>{}); 

			// A client is trying to connect to server
			webSocketServer.on( 'request', ( request: WebSocketRequest ) =>
			{
				console.log( `${new Date()} Connection requested from origin ${request.origin}.` );

				if ( !IsOriginAllowed( request.origin ) )
				{
					request.reject( /* httpStatus */ 401, /* reason */ HTTPCodes[401] );
					console.log( `${new Date()} Connection from origin "${request.origin}" rejected because unauthorized.` );
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
	const serverConfigs = new ServerConfigs();
	
	let bResult = true;
	const url_v6 = 'https://ipv6-api.speedtest.net/getip';
	const url_v4 = 'https://ipv4-api.speedtest.net/getip';
	const publicIPv6 : string | null = await ComUtils.HTTP_Get( url_v6 );
	const publicIPv4 : string | null = await ComUtils.HTTP_Get( url_v4 );
	
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

	serverConfigs.SetWebSocketPort( 3001 );
	serverConfigs.SetRequestListenerPort( 3000 );
	
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
//	console.log( UniqueID.Generate() ); console.log( UniqueID.Generate() );	console.log( UniqueID.Generate() );
//	console.log( UniqueID.Generate() );	console.log( UniqueID.Generate() );	console.log( UniqueID.Generate() );
//	console.log( UniqueID.Generate() );	console.log( UniqueID.Generate() );	console.log( UniqueID.Generate() );
//	console.log( UniqueID.Generate() );	console.log( UniqueID.Generate() );	console.log( UniqueID.Generate() );
	

//	const s3instnce = AWSUtils.S3.CreateInstance( '', '', 'eu-central-1' );
//	const bucketName = 'invrsion-productbank-development';
	
	/*	LIST TEST */
//	const s3Objects = await AWSUtils.S3.ListObjects( s3instnce, bucketName, ['PRD'], true );
//	console.log( s3Objects.length );

	/*	MULTIPLE DONWLOAD TEST */
//	const resKeys =
//	[
//		"PRD9999999999996_0/photo/thumbnail_bottom.png",
//		"PRD9999999999996_0/photo/thumbnail_front.png",
//		"PRD9999999999996_0/photo/thumbnail_left.png",
//		"PRD9999999999996_0/photo/thumbnail_right.png",
//		"PRD9999999999996_0/photo/thumbnail_top.png",
//		"PRD9999999999996_0/photo/top.jpg",
//		"PRD9999999999997_0/photo/back.jpg",
//		"PRD9999999999997_0/photo/bottom.jpg",
//		"PRD9999999999997_0/photo/front.jpg"
//	];	
//	const buffers = await AWSUtils.S3.DownloadResources( s3instnce, bucketName, resKeys );	
//	return;

		// DDATABASE
//		const db : MongoDatabase = await MongoDatabase.CreateConnection( 'drrqi', 'boris47', 'JEBRBQANDcf3Jodj', 'db0' );
//		const coll = await db.GetCollection( 'coll0' );
//		const result = await db.FindInCollection( coll, 'a', '1' );

//	const bLoggerCreated = await Logger.Initialize( 'ServerTS' );
//	if ( !bLoggerCreated )
//	{
//		return process.exit(1);
//	}
	{
		const bHasCommittedConfigFile = await UploadConfigurationFile();
		if ( !bHasCommittedConfigFile )
		{
			console.error( "Cannot upload configuration file" );
			return process.exit(1);
		}
	}

	const localStorage = await StorageManager.CreateNewStorage( EStorageType.LOCAL, 'local' );
	const remoteStorage = await StorageManager.CreateNewStorage( EStorageType.REMOTE, 'remote' );
	{
		const bResultLocal = await localStorage.LoadStorage();
		if ( !bResultLocal )
		{
			console.error( "Local Storage Unavailable" );
			process.exit(1);
		}
		
		const bResultRemote = await remoteStorage.LoadStorage();
		if ( !bResultRemote )
		{
			console.error( "Remote Storage Unavailable" );
			return process.exit(1);
		}
	}

	{	
		const bResult = await CreateServer();
		if ( !bResult )
		{
			console.error( "Cannot create server" );
			return process.exit(1);
		}
	}

	{
		while( true )
		{
			await GenericUtils.DelayMS( 1000 );
	
			await localStorage.SaveStorage();
		}
	}

}

/*
process.on( 'uncaughtException', ( error: Error ) =>
{
	console.error( `Uncaught Exception:\n${error.name}\n${error.message}\n${error.stack}` );
});

process.on( 'unhandledRejection', ( reason: {} | null | undefined, promise: Promise<any> ) =>
{
	console.error( 'Unhandled Rejection' );
});
*/

Main();