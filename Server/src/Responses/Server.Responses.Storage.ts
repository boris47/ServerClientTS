
import * as http from 'http';
import * as ComUtils from '../../../Common/Utils/ComUtils';
import ServerResponsesProcessing, { IServerRequestInternalOptions } from "./Server.Responses.Processing";
import { HTTPCodes } from "../HTTP.Codes";
import FS_Storage  from '../../../Common/FS_Storage';
import { EHeaders } from '../../../Common/Interfaces';

export default class ServerResponseStorage
{
	/////////////////////////////////////////////////////////////////////////////////////////
	public static async Get(request: http.IncomingMessage, response: http.ServerResponse): Promise<ComUtils.IServerResponseResult>
	{
		const key = request.headers[EHeaders.KEY] as string;
		if (typeof key !== 'string' || key.length === 0)
		{
			const err = `Storage Get: Invalid Key`;
			ServerResponsesProcessing.EndResponseWithError(response, err, 404); // Not Found
			return ComUtils.ResolveWithError("/storage:get", err);
		}

		const options: IServerRequestInternalOptions =
		{
			Key: key,
			Value: await FS_Storage.GetResource(key)
		};
		return ServerResponsesProcessing.ServetToClient(request, response, options);
	};

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async Add(request: http.IncomingMessage, response: http.ServerResponse): Promise<ComUtils.IServerResponseResult>
	{
		const key = request.headers[EHeaders.KEY] as string;
		if (typeof key !== 'string' || key.length === 0)
		{
			const err = `Storage Add: Invalid Key`;
			ServerResponsesProcessing.EndResponseWithError(response, err, 404); // Not Found
			return ComUtils.ResolveWithError("/storage:add", err);
		}
		const options: IServerRequestInternalOptions =
		{
			Key: key
		};
		const result = await ServerResponsesProcessing.ClientToServer(request, response, options);
		if (result.bHasGoodResult)
		{
			await FS_Storage.AddResource(key, result.body, true);
		}
		return result;
	};

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async Delete(request: http.IncomingMessage, response: http.ServerResponse): Promise<ComUtils.IServerResponseResult>
	{
		const key = request.headers[EHeaders.KEY] as string;
		if (typeof key !== 'string' || key.length === 0)
		{
			const err = `Storage Add: Invalid Key`;
			ServerResponsesProcessing.EndResponseWithError(response, err, 404); // Not Found
			return ComUtils.ResolveWithError("/localstorage:add", err);
		}
		
		if (!(await FS_Storage.HasResource(key)))
		{
			const err = `Entry "${ key }" not found`;
			ServerResponsesProcessing.EndResponseWithError(response, HTTPCodes[404], 404); // Not Found
			return ComUtils.ResolveWithError("/localstorage:delete", err);
		}

		if (!await FS_Storage.RemoveResource(key))
		{
			const err = `Cannot remove "${ key }" from storage`;
			ServerResponsesProcessing.EndResponseWithError(response, err, 500); // Internal Server Error
			return ComUtils.ResolveWithError("/localstorage:delete", err);
		}
		
		ServerResponsesProcessing.EndResponseWithGoodResult(response);
		return ComUtils.ResolveWithGoodResult(Buffer.from(HTTPCodes[200]));
	};
}