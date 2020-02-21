
import * as ipRegex from 'ip-regex';
import { IServerConfigs } from '../Common/Interfaces';

export class ServerConfigs implements IServerConfigs {
	
	public get PublicIP() : string
	{
		return this.ServerPublicIP;
	}

	public get WebSocketPort() : number
	{
		return this.ServerWebSocketPort;
	}

	public get RequestsListenerPort() : number
	{
		return this.ServerRequestsListenerPort;
	}
	

	private ServerPublicIP : string | null = null;
	private ServerWebSocketPort = -1;
	private ServerRequestsListenerPort = -1;


	public IsValid() : boolean
	{
		return this.PublicIP !== null && this.WebSocketPort > -1 && this.RequestsListenerPort > -1;
	}


	public SetCurrentPublicIP( PublicIP : string ) : boolean
	{
		if( ipRegex.v4({ exact: true }).test( PublicIP ) || ipRegex.v6({ exact: true }).test( PublicIP ) )
		{
			this.ServerPublicIP = PublicIP;
			return true;
		}
		return false;
	}


	public SetWebSocketPort( Port : number ) : boolean
	{
		if ( Port !== this.ServerRequestsListenerPort )
		{
			this.ServerWebSocketPort = Port;
			return true;
		}
		return false;
	}


	public SetRequestListenerPort( Port : number ) : boolean
	{
		if ( Port !== this.ServerWebSocketPort )
		{
			this.ServerRequestsListenerPort = Port;
			return true;
		}
		return false;
	}

}