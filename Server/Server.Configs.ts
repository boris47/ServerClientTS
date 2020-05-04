
import * as ipRegex from 'ip-regex';
import { IServerConfigs } from '../Common/Interfaces';


export class ServerConfigs implements IServerConfigs
{	
	public PublicIP : string | null;
	public WebSocketPort : number;
	public RequestsListenerPort : number;


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
			this.PublicIP = PublicIP;
			return true;
		}
		return false;
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public SetWebSocketPort( Port : number ) : boolean
	{
		if ( Port !== this.RequestsListenerPort )
		{
			this.WebSocketPort = Port;
			return true;
		}
		return false;
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public SetHTTPServerPort( Port : number ) : boolean
	{
		if ( Port !== this.WebSocketPort )
		{
			this.RequestsListenerPort = Port;
			return true;
		}
		return false;
	}
}