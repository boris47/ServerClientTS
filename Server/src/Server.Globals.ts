
import { connection as WebSocketConnection } from 'websocket';

export const ConnectedClients = new Array<WebSocketConnection>();

export const ServerInfo =
{
	MACHINE_PUBLIC_IPv4: '',
	MACHINE_PUBLIC_IPv6: '',

	HTTP_SERVER_PORT: 0, //3000,
	HTTP_SERVER_ADDRESS : '',
	WEBSOCKET_SERVER_PORT: 0,
	WEBSOCKET_SERVER_ADDRESS: '',
};

export const DOWNLOAD_LOCATION : string = '.\\Downloaded\\';