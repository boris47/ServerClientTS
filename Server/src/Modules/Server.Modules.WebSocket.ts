
import * as http from 'http';
import * as net from 'net';

import { ServerInfo, ConnectedClients } from "../Server.Globals";
import { HTTPCodes } from "../HTTP.Codes";

import
{
	server as WebSocketServer,
	IServerConfig,
	connection as WebSocketConnection,
	request as WebSocketRequest, IMessage
} from 'websocket';


export default class WebSocketModule
{
	private static instance: WebSocketModule = null;
	private connection: WebSocketConnection;
	private webSocketServer: WebSocketServer = null;


	/////////////////////////////////////////////////////////////////////////////////////////
	public static async Initialize(): Promise<boolean>
	{
		if( !WebSocketModule.instance )
		{
			const serverOptions = <http.ServerOptions>
			{
	
			};
	
			const listenOptions = <net.ListenOptions>
			{
				port: ServerInfo.WEBSOCKET_SERVER_PORT,
				host: '0.0.0.0'//'::'
			};
	
			const webSocketModule = new WebSocketModule();
			if( await webSocketModule.Initialize( serverOptions, listenOptions ) )
			{
				WebSocketModule.instance = webSocketModule;
			}
		}
		return !!WebSocketModule.instance;
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public static async Finalize(): Promise<void>
	{
		WebSocketModule.instance.webSocketServer.shutDown();
		console.log("WebSocketServer Closed");
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	private async Initialize( serverOptions : http.ServerOptions, listenOptions : net.ListenOptions ) : Promise<boolean>
	{
		const httpServer = http.createServer(serverOptions);
		await new Promise( (resolve) =>
		{
			httpServer.listen(listenOptions, () =>
			{
				const  { address, family, port } = httpServer.address() as net.AddressInfo || {};
				console.log(`WebSocket Server created at ${address}, port:${port}\n`);
				ServerInfo.WEBSOCKET_SERVER_PORT = port;
				ServerInfo.WEBSOCKET_SERVER_ADDRESS = address;
				resolve();
			});
		});
		const serverConfig = <IServerConfig>
		{
			httpServer: httpServer,

			autoAcceptConnections : false
		};
		const webSocketServer = new WebSocketServer(serverConfig);
		webSocketServer.on('request', (request: WebSocketRequest) => this.OnRequest(request));
		webSocketServer.on('connect', (connection: WebSocketConnection) => this.OnConnect(connection));
		webSocketServer.on('close', (connection: WebSocketConnection, reason: number, desc: string) => this.OnClose(connection, reason, desc));
		this.webSocketServer = webSocketServer;

	//	const result0 = await ServerCommunications.AddPortForwarding( ServerInfo.WEBSOCKET_SERVER_ADDRESS, ServerInfo.WEBSOCKET_SERVER_PORT, ServerInfo.MACHINE_PUBLIC_IP, ServerInfo.WEBSOCKET_SERVER_PORT );
	//	this.ruleName = await ServerCommunications.AddFirewallRule( ServerInfo.HTTP_SERVER_ADDRESS, ServerInfo.HTTP_SERVER_PORT );
		return true;
	}
	
	
	/////////////////////////////////////////////////////////////////////////////////////////
	public async Finalize(): Promise<void>
	{
	//	const result11 = await ServerCommunications.RemoveFirewallRule( this.ruleName );
	//	const result1 = await ServerCommunications.RemovePortForwarding( ServerInfo.WEBSOCKET_SERVER_ADDRESS, ServerInfo.WEBSOCKET_SERVER_PORT );
	}

	
	/////////////////////////////////////////////////////////////////////////////////////////
	private IsOriginAllowed(origin: string): boolean
	{
		return true;
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	private OnConnectionClose(code: number, desc: string)
	{
		console.log(`${ new Date() } Peer ${ this.connection.remoteAddress } disconnected`);
		ConnectedClients.splice(ConnectedClients.indexOf(this.connection), 1);
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	private OnMessage(data: IMessage)
	{
		let buffered: Buffer = null;
		switch (data.type)
		{
			case 'utf8':
				{
					buffered = Buffer.from(data.utf8Data);
					console.log("WebSocketModule:Received: '" + data.utf8Data + "'");
					this.connection.close(); // TODO
					break;
				}
			case 'binary':
				{
					buffered = Buffer.from(data.binaryData);
					break;
				}
		}
	}

	
	/////////////////////////////////////////////////////////////////////////////////////////
	private OnRequest(request: WebSocketRequest): void
	{
		// A client is trying to connect to server
		console.log(`${new Date()} Connection requested from origin ${ request.origin }.`);

		if (!this.IsOriginAllowed(request.origin))
		{
			request.reject( /* httpStatus */ 401, /* reason */ HTTPCodes[401]); // Unauthorized
			console.log(`${ new Date() } Connection from origin "${ request.origin }" rejected because unauthorized.`);
			return;
		}

		console.log(`${new Date()} Connection accepted.`);
		const connection : WebSocketConnection = request.accept('echo-protocol', request.origin);

		connection.on('error', (err: Error) =>
		{
			console.error(`Connection Error: "${ err.name }:${ err.message }"`);
		});

		connection.on('close', (code: number, desc: string) => this.OnConnectionClose(code, desc));
		connection.on('message', (data: IMessage) => this.OnMessage(data));

		ConnectedClients.push(connection);
		this.connection = connection;
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	private OnConnect( connection: WebSocketConnection )
	{

	}


	/////////////////////////////////////////////////////////////////////////////////////////
	private OnClose( connection: WebSocketConnection, reason: number, desc: string )
	{

	}
}