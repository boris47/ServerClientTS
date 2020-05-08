

import { client as WebSocketClient, IClientConfig, connection as WebSocketConnection, IMessage } from 'websocket';

import * as https from 'https';

import ServerConfigs from '../../../../Common/ServerConfigs';


export function Client_SetupWebSocket() : Promise<null | Error>
{
	const serverConfigs = ServerConfigs.instance;
	return new Promise<null | Error>( ( resolve : (value?: null | Error) => void ) =>
	{
		const config = <IClientConfig>
		{
		//	assembleFragments : false 					// Default
		//	closeTimeout : 5000, 						// Default 5000
		//	fragmentOutgoingMessages : true,			// Default true
		//	fragmentationThreshold : 16					// Default 16 ( Kib )
		//	maxReceivedFrameSize : 1					// Default 1 ( Mib )
		//	maxReceivedMessageSize: 8					// Default 8 ( Mib )
			tlsOptions	: <https.RequestOptions>
			{
				auth : null,							// ClientRequestArgs.auth?: string | null | undefined
				cert : undefined,						// string | Buffer | (string | Buffer)[] | undefined
				headers : undefined, 					// { [header: string]: number | string | string[] | undefined; } | undefined
			}
		
		//	webSocketVersion : 13						/// Default 13
		}

		const webSocketClient = new WebSocketClient( config );
		webSocketClient.on( 'connectFailed', function( err : Error )
		{
			console.log( 'Connect Error: ' + err.toString() );
			resolve( err );
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
			/*	let buffered : Buffer | null = null;
				switch( data.type )
				{
					case 'utf8' :
					{
						buffered = Buffer.from( data.utf8Data || '' );
						console.log( "Received: '" + data.utf8Data + "'" );
						break;
					}
					case 'binary' :
					{
						buffered = data.binaryData ? Buffer.from( data.binaryData ) : Buffer.from( '' );
						break;
					}
				}*/
			});

			connection.send( "Ciao, sono un client" );
		});

		webSocketClient.connect( `ws://${serverConfigs.PublicIP}:${serverConfigs.WebSocketPort}/websocket`, 'echo-protocol' );
		resolve( null );
	});
}
