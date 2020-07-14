


export interface ICommonResult
{
	bHasGoodResult : boolean;
	
	body : Buffer | null;
}

export enum EHeaders
{
	USERNAME = 'username',
	PASSWORD = 'password'
}

export interface IClientRequestResult extends ICommonResult
{

}

export interface IServerResponseResult extends ICommonResult
{

}


export interface IServerConfigs
{
	readonly PublicIP : string | null;
	
	readonly WebSocketPort : number;

	readonly RequestsListenerPort : number;
}

export interface IIndexableObject<T=any>
{
	[key:string] : T
}