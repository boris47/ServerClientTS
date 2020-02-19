
import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

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


async function ProcessRequest( request : IClientRequest ) : Promise<void>
{
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
		return request.OnResolve?.call( request, result.body );
	}
	else
	{
		const err = `Request "${request.path}" failed\nServer Say:\n${result.body.toString()}`;
		console.error( err );
		return request.OnReject?.call( request, new Error( err ) );
	}
}


async function Request( path : string, method : string, args:IClientRequestInternalOptions = {}, OnResolve : null | ResolveDelegate = null, OnReject : null | RejectDelegate = null ) : Promise<void>
{
	const newRequest : IClientRequest =
	{
		path : path,
		method : method.toLowerCase(),
		reqArgs : args,
		OnResolve : OnResolve,
		OnReject : OnReject
	};

	return ProcessRequest( newRequest );
}


async function RequestServerPing() : Promise<boolean>
{
	return new Promise<boolean>(( resolve : (value: boolean) => void ) =>
	{
		Request( '/ping', 'get', <IClientRequestInternalOptions>{},
			( body: Buffer ) =>
			{
				resolve( true );
			},
			( err: Error ) =>
			{
				resolve( false );
			}
		);
	});
}


async function RequestGetData<T>( key : string ) : Promise<T|null>
{
	return new Promise<T|null>(( resolve : (value: T) => void ) =>
	{
		Request( '/storage', 'get', <IClientRequestInternalOptions>{ Key: key },
			( body: Buffer ) =>
			{
				resolve( <T>( <unknown>body ) );
			},
			( err: Error ) =>
			{
				resolve( null );
			}
		);
	});
}

async function RequestSetData( Key : string, Value: any ) : Promise<boolean>
{
	return new Promise<boolean>( ( resolve : ( value: boolean ) => void ) =>
	{
		Request( '/storage', 'put', <IClientRequestInternalOptions>{ Key : Key, Value: Value },
			( body: Buffer ) =>
			{
				resolve( true );
			},
			( err: Error ) =>
			{
				resolve( false );
			}
		);
	});
}


async function RequestFileDownload( FileName : string ) : Promise<boolean>
{
	return new Promise<boolean>(( resolve : ( value: boolean ) => void ) =>
	{
		Request( '/download', 'get', <IClientRequestInternalOptions>{ AbsoluteFilePath: FileName },
			( body: Buffer ) =>
			{
				resolve( true );
			},
			( err: Error ) =>
			{
				resolve( false );
			}
		);
	});
}

async function RequestFileUpload( AbsoluteFilePath : string ) : Promise<boolean>
{
	return new Promise<boolean>(( resolve : ( value: boolean ) => void ) =>
	{
		Request( '/upload', 'put', <IClientRequestInternalOptions>{ AbsoluteFilePath: AbsoluteFilePath },
			( body: Buffer ) =>
			{
				resolve( true );
			},
			( err: Error ) =>
			{
				resolve( false );
			}
		);
	});
}



async function Main()
{
	{
		RequestServerPing()
		.then( ( bCanContinue : boolean ) =>
		{
			return bCanContinue ? RequestFileUpload( path.join( process.cwd(), 'Client.js' ) ) : Promise.reject(false);
		})
		.then( ( bCanContinue : boolean ) =>
		{
			return bCanContinue ? RequestFileDownload( './Server.js' ) : Promise.reject(false);
		})
		.then( ( bCanContinue : boolean ) =>
		{
			return bCanContinue ? RequestSetData( 'MyDataName', '123' ) : Promise.reject(false);
		})
		.then( ( bCanContinue : boolean ) =>
		{
			return bCanContinue ? RequestGetData<string>( 'MyDataName' ) : Promise.reject(null);
		})
		.then( ( value: string | null ) =>
		{
			console.log( "Value", value.toString() );
		})
		.catch( reason => console.error(reason) );

	}

	{
//		Request( '/ping', 'get' );
//		Request( '/upload', 'put', <IClientRequestInternalOptions>{ AbsoluteFilePath: './Client.js' }, (msg:Buffer) => console.log(msg.toString()), ( err:Error ) => console.error(err) );
//		Request( '/download', 'get', <IClientRequestInternalOptions>{ AbsoluteFilePath: './Server.js' } );
//		Request( '/storage', 'put', <IClientRequestInternalOptions>{ Key : 'MyDataName', Value: '123' } );
//		Request( '/storage', 'get', <IClientRequestInternalOptions>{ Key: 'MyDataName' } );
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






