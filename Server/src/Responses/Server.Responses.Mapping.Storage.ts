
import * as http from 'http';
import * as ComUtils from '../../../Common/Utils/ComUtils';
import ServerResponsesProcessing, { IServerRequestInternalOptions } from "./Server.Responses.Processing";
import { HTTPCodes } from "../HTTP.Codes";
import { ICustomServerStorage, CustomStorageManager } from '../Server.Storages';

export default class ServerResponseStorage
{
	/////////////////////////////////////////////////////////////////////////////////////////
	public static async Get(request: http.IncomingMessage, response: http.ServerResponse): Promise<ComUtils.IServerResponseResult>
	{
		const key = request.headers.key as string;
		const storageID = request.headers.storage as string;
		const storage: ICustomServerStorage = CustomStorageManager.GetStorage(storageID);
		if (!storage)
		{
			const err = `Storage "${ storageID }" Not Found`;
			ServerResponsesProcessing.EndResponseWithError(response, HTTPCodes[404], 404); // Not Found
			return ComUtils.ResolveWithError("/localstorage:get", err);
		}

		if (typeof key !== 'string')
		{
			const err = `Storage Get: Invalid Key`;
			ServerResponsesProcessing.EndResponseWithError(response, err, 404); // Not Found
			return ComUtils.ResolveWithError("/localstorage:get", err);
		}

		const options: IServerRequestInternalOptions =
		{
			Key: key,
			Value: await storage.GetResource(key)
		};
		return ServerResponsesProcessing.ServetToClient(request, response, options);
	};

	/////////////////////////////////////////////////////////////////////////////////////////
/*	public static async List(request: http.IncomingMessage, response: http.ServerResponse): Promise<ComUtils.IServerResponseResult>
	{
		const storageID = request.headers.storage as string;
		const storage: ICustomServerStorage = CustomStorageManager.GetStorage(storageID);
		if (!storage)
		{
			const err = `Storage "${ storageID }" Not Found`;
			ServerResponsesProcessing.EndResponseWithError(response, err, 404);
			return ComUtils.ResolveWithError("/localstorage:get", err);
		}
		const list: string[] = await storage.ListResources();
		ServerResponsesProcessing.EndResponseWithGoodResult(response, JSON.stringify(list));
		return ComUtils.ResolveWithGoodResult(Buffer.from(HTTPCodes[200]));
	};*/

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async Add(request: http.IncomingMessage, response: http.ServerResponse): Promise<ComUtils.IServerResponseResult>
	{
		const key = request.headers.key as string;
		const storageID = request.headers.storage as string;
		const storage: ICustomServerStorage = CustomStorageManager.GetStorage(storageID);
		if (!storage)
		{
			const err = `Storage "${ storageID }" Not Found`;
			ServerResponsesProcessing.EndResponseWithError(response, err, 404); // Not Found
			return ComUtils.ResolveWithError("/localstorage:put", err);
		}

		const options: IServerRequestInternalOptions =
		{
			Key: key
		};
		const result = await ServerResponsesProcessing.ClientToServer(request, response, options);
		if (result.bHasGoodResult)
		{
			await storage.AddResource(key, result.body, true);
		}
		return result;
	};

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async Delete(request: http.IncomingMessage, response: http.ServerResponse): Promise<ComUtils.IServerResponseResult>
	{
		const key = request.headers.key as string;
		const storageID = request.headers.storage as string;
		const storage: ICustomServerStorage = CustomStorageManager.GetStorage(storageID);
		if (!storage)
		{
			const err = `Storage "${ storageID }" Not Found`;
			ServerResponsesProcessing.EndResponseWithError(response, err, 404); // Not Found
			return ComUtils.ResolveWithError("/localstorage:delete", err);
		}

		if (!(await storage.HasResource(key)))
		{
			const err = `Entry "${ key }" not found`;
			ServerResponsesProcessing.EndResponseWithError(response, HTTPCodes[404], 404); // Not Found
			return ComUtils.ResolveWithError("/localstorage:delete", err);
		}

		if (!await storage.RemoveResource(key))
		{
			const err = `Cannot remove "${ key }" from "${ storageID }"`;
			ServerResponsesProcessing.EndResponseWithError(response, err, 500); // Internal Server Error
			return ComUtils.ResolveWithError("/localstorage:delete", err);
		}
		
		ServerResponsesProcessing.EndResponseWithGoodResult(response);
		return ComUtils.ResolveWithGoodResult(Buffer.from(HTTPCodes[200]));
	};
}