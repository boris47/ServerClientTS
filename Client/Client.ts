
import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';

import { IServerInfo, IClientRequestResult } from '../Common/Interfaces'
import { ClientRequests, IClientRequestInternalOptions } from './Client.Requests';


let serverPublicIp = "0.0.0.0";// "0.0.0.0";
const serverConfigFileName = './ServerCfg.json';
if ( fs.existsSync( serverConfigFileName ) )
{
	const fileContent = fs.readFileSync( serverConfigFileName, 'utf8' );
	const fileJson : IServerInfo = JSON.parse( fileContent );
//	serverPublicIp = fileJson.ServerIp;
}

const CommonOptions : http.RequestOptions = {
	host: `${serverPublicIp}`,
	port: 3000,
	timeout : 500,
};


type ResolveDelegate = ( body : Buffer ) => void;
type RejectDelegate = ( err : Error ) => void;

interface IClientRequest {
	path : string;
	method : string;
	reqArgs : IClientRequestInternalOptions;
	OnResolve : ResolveDelegate | null;
	OnReject : RejectDelegate | null;
}

const requestsToProcess : Array<IClientRequest> = new Array<IClientRequest>();

async function ProcessRequest()
{
	if ( requestsToProcess.length === 0 )
	{
		console.log( "CLIENT JOB COMPLETED" );
		process.exit(0);
	}

	const request : IClientRequest = requestsToProcess.shift();
	const identifier : string = request.path;

	// Check if request is mapped
	const availableMethods : IRequestsMethods = RequestsMap[identifier];
	if ( !availableMethods )
	{
		const err = `Request "${request.path}" is not mapped`;
		console.error( err );
		return request.OnReject?.call( request, new Error( err ) );
	}

	// Check if method is defined
	const method : ( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) => Promise<IClientRequestResult> = availableMethods[request.method.toLowerCase()];
	if ( !method )
	{
		const err = `Request "${request.path}" failed\nMethod: ${request.method} for request ${identifier} is undefined`;
		console.error( err );
		return request.OnReject?.call( request, new Error( err ) );
	}
	
	// Execute the request
	const options = Object.assign({}, CommonOptions, request );
	const result : IClientRequestResult = await method( options, request.reqArgs );
	if ( result && result.bHasGoodResult )
	{
		console.log( `Request "${request.path}" satisfied\nResult: ${result.bHasGoodResult}` );
		request.OnResolve?.call( request, result.body );
	}
	else
	{
		const err = `Request "${request.path}" failed\nServer Say:\n${result.body.toString()}`;
		console.error( err );
		request.OnReject?.call( request, new Error( err ) );
	}

}


function AddRequest( path : string, method : string, args:IClientRequestInternalOptions = {}, OnResolve : null | ResolveDelegate = null, OnReject : null | RejectDelegate = null )
{
	const newRequest : IClientRequest =
	{
		path : path,
		method : method.toLowerCase(),
		reqArgs : args,
		OnResolve : OnResolve,
		OnReject : OnReject
	};
	requestsToProcess.push( newRequest );
}

async function Main()
{
	{
		AddRequest( '/ping', 'get' );
		AddRequest( '/upload', 'put', <IClientRequestInternalOptions>{ AbsoluteFilePath: './Client.js' }, (msg:Buffer) => console.log(msg.toString()), ( err:Error ) => console.error(err) );
		AddRequest( '/download', 'get', <IClientRequestInternalOptions>{ AbsoluteFilePath: './Server.js' } );
		AddRequest( '/data', 'put', <IClientRequestInternalOptions>{ Key : 'MyDataName', Value: '123' } );
		AddRequest( '/data', 'get', <IClientRequestInternalOptions>{ Key: 'MyDataName' } );
	}

	while( true )
	{
//		await GenericUtils.DelayMS( 1000 );
		await ProcessRequest();
	}
}













////////   	WEBSOCKET SETUP






import { client as WebSocketClient, IClientConfig, connection as WebSocketConnection, IMessage } from 'websocket';
import { IRequestsMethods, RequestsMap } from './Client.RequestsMap';

{
	const config = <IClientConfig>
	{
	//	assembleFragments : false 					// Default
	//	closeTimeout : 5000, 						// Default 5000
	//	fragmentOutgoingMessages : true,			// Default true
	//	fragmentationThreshold : 16					// Default 16 ( Kib )
	//	maxReceivedFrameSize : 1					// Default 1 ( Mib )
	//	maxReceivedMessageSize: 8					// Default 8 ( Mib )
	/*	tlsOptions	: <https.RequestOptions>
		{

		}
	*/
	//	webSocketVersion : 13						/// Default 13
	}

	const webSocketClient = new WebSocketClient( config );

	webSocketClient.on( 'connectFailed', function( err : Error )
	{
		console.log( 'Connect Error: ' + err.toString() );
	});
	
	webSocketClient.on( 'connect', ( connection: WebSocketConnection ) =>
	{
		console.log( 'WebSocket Client Connected' );

		connection.on('error', ( err: Error ) =>
		{
			console.error( `Connection Error: "${err.name}:${err.message}"` );
		});

		connection.on( 'close', ( code: number, desc: string ) =>
		{
			console.log('echo-protocol Connection Closed');
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
					connection.send( "Ciao, sono un client" );
					break;
				}
				case 'binary' :
				{
					buffered = Buffer.from( data.binaryData );
					break;
				}
			}
		});

		connection.send( "Ciao, sono un client" );
	});

	webSocketClient.connect( 'ws://localhost:3001/websocket', 'echo-protocol' );
}






Main();






