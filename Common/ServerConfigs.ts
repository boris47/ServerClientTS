
import * as fs from 'fs';

import { IServerConfigs } from '../Common/Interfaces';

export default class ServerConfigs
{
	public readonly PublicIPv4 : string = '127.0.0.1';
	public readonly PublicIPv6 : string = '0:0:0:0:0:0:0:1';
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
		console.log( `ServerConfig: Cannot locate file "${filePath}"` );
		return null;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public AreValidData() : boolean
	{
		return (
			this.PublicIPv4 !== null && this.PublicIPv4.length > 0 || this.PublicIPv6 !== null && this.PublicIPv6.length > 0
			&& this.RequestsListenerPort > 0 && this.WebSocketPort > 0
		);
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public SetCurrentPublicIPv4( PublicIPv4 : string ) : void
	{
		(this.PublicIPv4 as string) = PublicIPv4;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public SetCurrentPublicIPv6( PublicIPv6 : string ) : void
	{
		(this.PublicIPv6 as string) = PublicIPv6;
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