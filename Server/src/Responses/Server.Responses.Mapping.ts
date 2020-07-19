
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as ComUtils from '../../../Common/Utils/ComUtils';
import * as mime from 'mime-types';
import FSUtils from '../../../Common/Utils/FSUtils';
import ServerResponsesProcessing, { IServerRequestInternalOptions } from "./Server.Responses.Processing";
import { IServerStorage, StorageManager } from "../Server.Storages";
import { DOWNLOAD_LOCATION } from '../Server.Globals';
import { HTTPCodes } from "../HTTP.Codes";
import { ITemplatedObject } from '../../../Common/Utils/GenericUtils';
import ServerUserManager from '../Users/Server.User.Manager';


export interface IResponsesMapItem
{
	requiresAuth: boolean;
	responseMethods : IResponseMethods
}


export interface IResponseMethods
{
	[key: string]: ( (request: http.IncomingMessage, response: http.ServerResponse) => Promise<ComUtils.IServerResponseResult>);
	post?: (request: http.IncomingMessage, response: http.ServerResponse) => Promise<ComUtils.IServerResponseResult>;
	get?: (request: http.IncomingMessage, response: http.ServerResponse) => Promise<ComUtils.IServerResponseResult>;
	put?: (request: http.IncomingMessage, response: http.ServerResponse) => Promise<ComUtils.IServerResponseResult>;
	patch?: (request: http.IncomingMessage, response: http.ServerResponse) => Promise<ComUtils.IServerResponseResult>;
	delete?: (request: http.IncomingMessage, response: http.ServerResponse) => Promise<ComUtils.IServerResponseResult>;
}


/////////////////////////////////////////////////////////////////////////////////////////
export const NotExistingPath = async (request: http.IncomingMessage, response: http.ServerResponse): Promise<ComUtils.IServerResponseResult> =>
{
	const options: IServerRequestInternalOptions =
	{
		Value: Buffer.from(HTTPCodes[404]) // Not Found
	};
	const result: ComUtils.IServerResponseResult = await ServerResponsesProcessing.ServetToClient(request, response, options);
	result.bHasGoodResult = false; // bacause on server we want register as failure
	return result;
};


/////////////////////////////////////////////////////////////////////////////////////////
export const MethodNotAllowed = async (request: http.IncomingMessage, response: http.ServerResponse): Promise<ComUtils.IServerResponseResult> =>
{
	const options: IServerRequestInternalOptions =
	{
		Value: Buffer.from(HTTPCodes[405]) // Method Not Allowed
	};
	const result: ComUtils.IServerResponseResult = await ServerResponsesProcessing.ServetToClient(request, response, options);
	result.bHasGoodResult = false; // bacause on server we want register as failure
	return result;
};


/////////////////////////////////////////////////////////////////////////////////////////
const PingResponse = async (request: http.IncomingMessage, response: http.ServerResponse): Promise<ComUtils.IServerResponseResult> =>
{
	const options: IServerRequestInternalOptions =
	{
		Value: Buffer.from('Ping Response')
	};
	const result: ComUtils.IServerResponseResult = await ServerResponsesProcessing.ServetToClient(request, response, options);
	return result;
};


/////////////////////////////////////////////////////////////////////////////////////////
const UserRegister = async (request: http.IncomingMessage, response: http.ServerResponse): Promise<ComUtils.IServerResponseResult> =>
{
	const username = request.headers.username as string;
	const password = request.headers.password as string;
	const token = await ServerUserManager.RegisterUser(username, password);
	if (!token)
	{
		ServerResponsesProcessing.EndResponseWithError(response, HTTPCodes[401], 401);
		return ComUtils.ResolveWithError('[LOGIN]', 'User already exists');
	}

	ServerResponsesProcessing.EndResponseWithGoodResult(response, token);
	return ComUtils.ResolveWithGoodResult();
};


/////////////////////////////////////////////////////////////////////////////////////////
const UserLogin = async (request: http.IncomingMessage, response: http.ServerResponse): Promise<ComUtils.IServerResponseResult> =>
{
	const username = request.headers.username as string;
	const password = request.headers.password as string;
	const token = await ServerUserManager.UserLogin(username, password);
	if ( !token )
	{
		ServerResponsesProcessing.EndResponseWithError(response, HTTPCodes[401], 401);
		return ComUtils.ResolveWithError('[LOGIN]', 'User not exists');
	}
	ServerResponsesProcessing.EndResponseWithGoodResult(response, token);
	return ComUtils.ResolveWithGoodResult();
};

/////////////////////////////////////////////////////////////////////////////////////////
const UserLoginByToken = async (request: http.IncomingMessage, response: http.ServerResponse): Promise<ComUtils.IServerResponseResult> =>
{
	const token = request.headers.token as string;
	const bLoggedIn = await ServerUserManager.UserLoginByToken(token);
	if ( !bLoggedIn )
	{
		const err = `Login required`;
		ServerResponsesProcessing.EndResponseWithError(response, err, 401);
		return ComUtils.ResolveWithError('[LOGIN]', err);
	}

	ServerResponsesProcessing.EndResponseWithGoodResult(response);
	return ComUtils.ResolveWithGoodResult();
}

/////////////////////////////////////////////////////////////////////////////////////////
const UserLogout = async (request: http.IncomingMessage, response: http.ServerResponse): Promise<ComUtils.IServerResponseResult> =>
{
	const token = request.headers.token as string;
	await ServerUserManager.UserLogout(token);

	ServerResponsesProcessing.EndResponseWithGoodResult(response);
	return ComUtils.ResolveWithGoodResult();
};


/////////////////////////////////////////////////////////////////////////////////////////
/** Client -> Server */
const DownloadResource = async (request: http.IncomingMessage, response: http.ServerResponse): Promise<ComUtils.IServerResponseResult> =>
{
	// Execute file upload to client
	const identifier = request.headers.identifier as string;
	const token = request.headers.token as string;
	const filePath = path.join(DOWNLOAD_LOCATION, token, identifier);
	await FSUtils.EnsureDirectoryExistence(path.dirname(filePath));

	const options: IServerRequestInternalOptions =
	{
		WriteStream: fs.createWriteStream(filePath)
	};
	return ServerResponsesProcessing.ClientToServer(request, response, options);
};

/////////////////////////////////////////////////////////////////////////////////////////
/** Server -> Client */
const UploadResource = async (request: http.IncomingMessage, response: http.ServerResponse): Promise<ComUtils.IServerResponseResult> =>
{
	// Execute file download server side
	const identifier = request.headers.identifier as string;
	const token = request.headers.token as string;
	const options: IServerRequestInternalOptions = {};
	const filePath = path.join(DOWNLOAD_LOCATION, token, identifier);

	// Check if file exists
	if (!(await FSUtils.FileExistsAsync(filePath)))
	{
		const err = `Resource ${ identifier } doesn't exist`;
		ServerResponsesProcessing.EndResponseWithError(response, err, 404);
		return ComUtils.ResolveWithError("ServerResponses:UploadResource", err);
	}

	options.Headers = {};
	{
		// Check if content type can be found
		const contentType: string = mime.lookup(path.parse(filePath).ext) || 'application/octet-stream';
		options.Headers['content-type'] = contentType;

		// Check file Size
		const sizeInBytes: number | null = FSUtils.GetFileSizeInBytesOf(filePath);
		if (sizeInBytes === null)
		{
			const err = `Cannot obtain size of file ${ filePath }`;
			ServerResponsesProcessing.EndResponseWithError(response, err, 400);
			return ComUtils.ResolveWithError("ServerResponses:UploadResource", err);
		}
		options.Headers['content-length'] = sizeInBytes;
	}

	options.ReadStream = fs.createReadStream(filePath);
	return ServerResponsesProcessing.ServetToClient(request, response, options);
};


/////////////////////////////////////////////////////////////////////////////////////////



/////////////////////////////////////////////////////////////////////////////////////////
const Storage_Get = async (request: http.IncomingMessage, response: http.ServerResponse): Promise<ComUtils.IServerResponseResult> =>
{
	const key = request.headers.key as string;
	const storageID = request.headers.storage as string;
	const storage: IServerStorage = StorageManager.GetStorage(storageID);
	if (!storage)
	{
		const err = `Storage "${ storageID }" Not Found`;
		ServerResponsesProcessing.EndResponseWithError(response, err, 404);
		return ComUtils.ResolveWithError("/localstorage:get", err);
	}

	if (!key)
	{
		const err = `Storage Get: Invalid Key`;
		ServerResponsesProcessing.EndResponseWithError(response, err, 404);
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
const Storage_Put = async (request: http.IncomingMessage, response: http.ServerResponse): Promise<ComUtils.IServerResponseResult> =>
{
	const key = request.headers.key as string;
	const storageID = request.headers.storage as string;
	const storage: IServerStorage = StorageManager.GetStorage(storageID);
	if (!storage)
	{
		const err = `Storage "${ storageID }" Not Found`;
		ServerResponsesProcessing.EndResponseWithError(response, err, 404);
		return ComUtils.ResolveWithError("/localstorage:put", err);
	}

	const options: IServerRequestInternalOptions =
	{
		Key: key
	};
	const result: ComUtils.IServerResponseResult = await ServerResponsesProcessing.ClientToServer(request, response, options);
	if (result.bHasGoodResult)
	{
		await storage.AddResource(key, result.body, true);
	}
	return result;
};

/////////////////////////////////////////////////////////////////////////////////////////
const Storage_Delete = async (request: http.IncomingMessage, response: http.ServerResponse): Promise<ComUtils.IServerResponseResult> =>
{
	const key = request.headers.key as string;
	const storageID = request.headers.storage as string;
	const storage: IServerStorage = StorageManager.GetStorage(storageID);
	if (!storage)
	{
		const err = `Storage "${ storageID }" Not Found`;
		ServerResponsesProcessing.EndResponseWithError(response, err, 404);
		return ComUtils.ResolveWithError("/localstorage:delete", err);
	}

	if (await storage.HasResource(key))
	{
		if (!await storage.RemoveResource(key))
		{
			const err = `Cannot remove "${ key }" from "${ storageID }"`;
			ServerResponsesProcessing.EndResponseWithError(response, err, 500);
			return ComUtils.ResolveWithError("/localstorage:delete", err);
		}
		ServerResponsesProcessing.EndResponseWithGoodResult(response);
		return ComUtils.ResolveWithGoodResult(Buffer.from(HTTPCodes[200]));
	}
	else
	{
		const err = `Entry "${ key }" not found`;
		ServerResponsesProcessing.EndResponseWithError(response, err, 404);
		return ComUtils.ResolveWithError("/localstorage:delete", err);
	}
};

/////////////////////////////////////////////////////////////////////////////////////////
const Storage_List = async (request: http.IncomingMessage, response: http.ServerResponse): Promise<ComUtils.IServerResponseResult> =>
{
	const storageID = request.headers.storage as string;
	const storage: IServerStorage = StorageManager.GetStorage(storageID);
	if (!storage)
	{
		const err = `Storage "${ storageID }" Not Found`;
		ServerResponsesProcessing.EndResponseWithError(response, err, 404);
		return ComUtils.ResolveWithError("/localstorage:get", err);
	}
	const list: string[] = await storage.ListResources();
	ServerResponsesProcessing.EndResponseWithGoodResult(response, JSON.stringify(list));
	return ComUtils.ResolveWithGoodResult(Buffer.from(HTTPCodes[200]));
};




/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////

export const ResponsesMap: ITemplatedObject<IResponsesMapItem> =
{
	'/ping':
	{
		requiresAuth: false,
		responseMethods:
		{
			post: PingResponse,
			get: PingResponse,
			put: PingResponse,
			patch: PingResponse,
			delete: PingResponse,
		}
	},

	'/user_register':
	{
		requiresAuth: false,
		responseMethods:
		{
			put: UserRegister,
		}
	},

	'/user_login':
	{
		requiresAuth: false,
		responseMethods:
		{
			put: UserLogin,
		}
	},

	'user_login_token':
	{
		requiresAuth: false,
		responseMethods:
		{
			put: UserLoginByToken,
		}
	},

	'/user_logout':
	{
		requiresAuth: false,
		responseMethods:
		{
			put: UserLogout,
		}
	},

	'/upload':
	{
		requiresAuth: true,
		responseMethods:
		{
			put: DownloadResource,
		}
	},

	'/download':
	{
		requiresAuth: true,
		responseMethods:
		{
			get: UploadResource,
		}
	},

	'/storage':
	{
		requiresAuth: true,
		responseMethods:
		{
			get: Storage_Get,
			put: Storage_Put,
			delete: Storage_Delete,
		}
	},

	'/storage_list':
	{
		requiresAuth: true,
		responseMethods:
		{
			get: Storage_List,
		}
	}
};