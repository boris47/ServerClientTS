
import * as https from 'https';

import { client as WebSocketClient, IClientConfig, connection as WebSocketConnection, IMessage } from 'websocket';
import ServerConfigs from '../../../../Common/ServerConfigs';


export default class WebSocketManager
{
	private static instance: WebSocketManager = null;
//	private static client: WebSocketClient = null;
	private static connection: WebSocketConnection = null;

	public static Initialize(): boolean
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
		webSocketClient.on( 'connectFailed', ( err : Error ) => console.error( `Connect Error: ${err.toString()}`));
		webSocketClient.on( 'connect', ( connection: WebSocketConnection ) => WebSocketManager.OnConnect(connection) );

		const { PublicIPv4, WebSocketPort } = ServerConfigs.instance;
		webSocketClient.connect( `ws://${PublicIPv4}:${WebSocketPort}/websocket`, 'echo-protocol' );
//		WebSocketManager.client = webSocketClient;
		
return true;
	}


	private static OnConnect(connection: WebSocketConnection)
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

		connection.on( 'message', (data: IMessage) => WebSocketManager.OnMessage(data));
	}


	private static OnMessage( data: IMessage )
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
	}


	public static SendMessage(message: Buffer): Promise<Error | null>
	{
		if (!WebSocketManager.instance)
		{
			return null;
		}

		return new Promise<Error | null>( (resolve: (value: Error | null) => void) =>
		{
			WebSocketManager.connection.sendBytes(message, ( err: Error ) =>
			{
				if (err)
				{
					console.error(`WebSocketManager::SendMessage: Error ${err.toString()}`);
				}
				resolve(err || null);
			});

		});

	}
}
