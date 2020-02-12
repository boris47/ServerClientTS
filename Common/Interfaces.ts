
export interface IServerInfo
{
	ServerIp : string;
}

export interface ICommonResult
{
	bHasGoodResult : boolean;
	
	body : string | null;
}

export interface IClientRequestResult extends ICommonResult
{

}

export interface IServerResponseResult extends ICommonResult
{

}