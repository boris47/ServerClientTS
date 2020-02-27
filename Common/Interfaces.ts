
export interface IServerConfigs
{
	readonly PublicIP : string | null;
	
	readonly WebSocketPort : number;

	readonly RequestsListenerPort : number;

}

export interface ICommonResult
{
	bHasGoodResult : boolean;
	
	body : Buffer | null;
}

export interface IClientRequestResult extends ICommonResult
{

}

export interface IServerResponseResult extends ICommonResult
{

}

export interface IURLParseResult {

	KeyValues : Map<string, string>;

	Switches : string[];

	Arrays : Map<string, string[]>;

}