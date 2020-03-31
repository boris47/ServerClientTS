
import * as ipRegex from 'ip-regex';
import { IServerConfigs } from '../Common/Interfaces';


export class ServerConfigs implements IServerConfigs
{	
	public get PublicIP() : string
	{
		return this.serverPublicIP;
	}

	public get WebSocketPort() : number
	{
		return this.serverWebSocketPort;
	}

	public get RequestsListenerPort() : number
	{
		return this.serverRequestsListenerPort;
	}
	

	private serverPublicIP : string | null = null;
	private serverWebSocketPort = -1;
	private serverRequestsListenerPort = -1;


	/////////////////////////////////////////////////////////////////////////////////////////
	public IsValid() : boolean
	{
		return this.PublicIP !== null && this.WebSocketPort > -1 && this.RequestsListenerPort > -1;
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public SetCurrentPublicIP( PublicIP : string ) : boolean
	{
		if( ipRegex.v4({ exact: true }).test( PublicIP ) || ipRegex.v6({ exact: true }).test( PublicIP ) )
		{
			this.serverPublicIP = PublicIP;
			return true;
		}
		return false;
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public SetWebSocketPort( Port : number ) : boolean
	{
		if ( Port !== this.serverRequestsListenerPort )
		{
			this.serverWebSocketPort = Port;
			return true;
		}
		return false;
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public SetHTTPServerPort( Port : number ) : boolean
	{
		if ( Port !== this.serverWebSocketPort )
		{
			this.serverRequestsListenerPort = Port;
			return true;
		}
		return false;
	}
}