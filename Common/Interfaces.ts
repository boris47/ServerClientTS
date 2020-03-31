
export interface IServerConfigs
{
	readonly PublicIP : string | null;
	
	readonly WebSocketPort : number;

	readonly RequestsListenerPort : number;

}