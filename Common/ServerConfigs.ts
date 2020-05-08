
import * as fs from 'fs';

import { IServerConfigs } from '../Common/Interfaces';

export default class ServerConfigs
{
	public readonly PublicIP : string | null = '0.0.0.0';
	public readonly RequestsListenerPort : number = 0;
	public readonly WebSocketPort : number = 0;

	public static readonly instance :ServerConfigs = new ServerConfigs();

	public static Load( filePath: string ) : boolean
	{
		if ( fs.existsSync( filePath ) )
		{
			const fileContent = fs.readFileSync( filePath, 'utf8' );
			let fileJson : IServerConfigs = null;
			try
			{
				fileJson = JSON.parse( fileContent );
			}
			catch( ex )
			{
				console.error( "ServerConfigs:Load:", ex );
				return null;
			}
		//	ServerConfigs.instance.SetCurrentPublicIP( fileJson.PublicIP );
			ServerConfigs.instance.SetHTTPServerPort( fileJson.RequestsListenerPort );
			ServerConfigs.instance.SetWebSocketPort( fileJson.WebSocketPort );
			return ServerConfigs.instance.AreValidData()
		}
		return null;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public AreValidData() : boolean
	{
		return this.PublicIP !== null && this.PublicIP.length > 0 && this.RequestsListenerPort > 0 && this.WebSocketPort > 0;
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public SetCurrentPublicIP( PublicIP : string ) : void
	{
		(this.PublicIP as string) = PublicIP;
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public SetWebSocketPort( Port : number ) : boolean
	{
		if ( Port !== this.RequestsListenerPort )
		{
			(this.WebSocketPort as number) = Port;
			return true;
		}
		return false;
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public SetHTTPServerPort( Port : number ) : boolean
	{
		if ( Port !== this.WebSocketPort )
		{
			(this.RequestsListenerPort as number) = Port;
			return true;
		}
		return false;
	}
}