
import * as http from 'http';
import * as fs from 'fs';

import { HTTPCodes } from "./HTTP.Codes";

import { ServerResponses } from "./Server.Responses";
import * as ComUtils from '../Common/ComUtils';
import { IServerStorage, StorageManager } from "./Server.Storages";
import GenericUtils from '../Common/GenericUtils';

export const NotImplementedResponse = async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<ComUtils.IServerResponseResult> =>
{
	const options = <IServerRequestInternalOptions>
	{
		Value : Buffer.from( HTTPCodes[404] )
	}
	const result : ComUtils.IServerResponseResult = await ServerResponses.Request_GET( request, response, options );
	result.bHasGoodResult = false; // bacause in any case on server we want register as failure
	return result;
};


export const MethodNotAllowed = async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<ComUtils.IServerResponseResult> =>
{
	const options = <IServerRequestInternalOptions>
	{
		Value : Buffer.from( HTTPCodes[405] )
	};
	const result : ComUtils.IServerResponseResult = await ServerResponses.Request_GET( request, response, options );
	result.bHasGoodResult = false; // bacause in any case on server we want register as failure
	return result;
};

export interface IResponseMethods
{
	[key:string]: ( request : http.IncomingMessage, response : http.ServerResponse ) => Promise<ComUtils.IServerResponseResult>;
	post? 		: ( request : http.IncomingMessage, response : http.ServerResponse ) => Promise<ComUtils.IServerResponseResult>;
	get? 		: ( request : http.IncomingMessage, response : http.ServerResponse ) => Promise<ComUtils.IServerResponseResult>;
	put? 		: ( request : http.IncomingMessage, response : http.ServerResponse ) => Promise<ComUtils.IServerResponseResult>;
	patch? 		: ( request : http.IncomingMessage, response : http.ServerResponse ) => Promise<ComUtils.IServerResponseResult>;
	delete? 	: ( request : http.IncomingMessage, response : http.ServerResponse ) => Promise<ComUtils.IServerResponseResult>;
}

export interface IServerRequestInternalOptions
{
	FileName? : string;
	Key? : string;
	Value? : Buffer | null;
	Headers? : {
		[key:string] : any
	};
	FileStream? : fs.ReadStream;
}



interface ServerResponseMap
{
	[key:string] : IResponseMethods
}

/////////////////////////////////////////////////////////////////////////////////////////
const pingResponse = async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<ComUtils.IServerResponseResult> =>
{
	const options = <IServerRequestInternalOptions>
	{
		Value : Buffer.from( 'Ping Response' )
	};
	const result : ComUtils.IServerResponseResult = await ServerResponses.Request_GET( request, response, options );
	return result;
};


/////////////////////////////////////////////////////////////////////////////////////////
const uploadResponse = async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<ComUtils.IServerResponseResult> =>
{
	// Execute file upload to client
	const fileName = request.url.split('=')[1];
	const options = <IServerRequestInternalOptions>
	{
		FileName : fileName
	};
	return await ServerResponses.DownloadFile( request, response, options );
};

/////////////////////////////////////////////////////////////////////////////////////////
const downloadResponse = async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<ComUtils.IServerResponseResult> =>
{
	// Execute file download server side
	const fileName = request.url.split('=')[1];
	const options = <IServerRequestInternalOptions>
	{
		FileName : fileName
	};
	return await ServerResponses.UploadFile( request, response, options );
};

/////////////////////////////////////////////////////////////////////////////////////////
const storage_Get = async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<ComUtils.IServerResponseResult> =>
{
	const searchParams = new URLSearchParams( request.url.split('?')[1] );
	const key = searchParams.get( 'key' );
	const storageID = searchParams.get( 'stg' );
	const storage : IServerStorage = StorageManager.GetStorage( storageID );
	if( !storage )
	{
		const err = `Storage "${storageID}" Not Found`;
		ServerResponses.EndResponseWithError( response, err, 404 );
		return ComUtils.ResolveWithError( "/localstorage:get", err );
	}

	const options = <IServerRequestInternalOptions>
	{
		Key : key,
		Value : await storage.GetResource( key )
	};
	return await ServerResponses.Request_GET( request, response, options );
};

/////////////////////////////////////////////////////////////////////////////////////////
const storage_Put = async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<ComUtils.IServerResponseResult> =>
{
	const searchParams = new URLSearchParams( request.url.split('?')[1] );
	const key = searchParams.get( 'key' );
	const storageID = searchParams.get( 'stg' );
	const storage : IServerStorage = StorageManager.GetStorage( storageID );
	if( !storage )
	{
		const err = `Storage "${storageID}" Not Found`;
		ServerResponses.EndResponseWithError( response, err, 404 );
		return ComUtils.ResolveWithError( "/localstorage:put", err );
	}

	const options = <IServerRequestInternalOptions>
	{
		Key : key
	};
	const result : ComUtils.IServerResponseResult = await ServerResponses.Request_PUT( request, response, options );
	if ( result.bHasGoodResult )
	{
		await storage.AddResource( key, result.body, false );
	}
	return result;
};

/////////////////////////////////////////////////////////////////////////////////////////
const storage_Delete = async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<ComUtils.IServerResponseResult> =>
{
	const parsedUrl = new URL( request.url );
	const key = parsedUrl.searchParams.get( 'key' );
	const storageID = parsedUrl.searchParams.get( 'stg' );
	const storage : IServerStorage = StorageManager.GetStorage( storageID );
	if( !storage )
	{
		const err = `Storage "${storageID}" Not Found`;
		ServerResponses.EndResponseWithError( response, err, 404 );
		return ComUtils.ResolveWithError( "/localstorage:delete", err );
	}

	if ( await storage.HasResource( key ) )
	{
		if( !await storage.RemoveResource( key ) )
		{
			const err = `Cannot remove "${key}" from "${storageID}"`;
			ServerResponses.EndResponseWithError( response, err, 500 );
			return ComUtils.ResolveWithError( "/localstorage:delete", err );
		}
		ServerResponses.EndResponseWithGoodResult( response );
		return ComUtils.ResolveWithGoodResult( Buffer.from( HTTPCodes[200] ) );
	}
	else
	{
		const err = `Entry "${key}" not found`;
		ServerResponses.EndResponseWithError( response, err, 404 );
		return ComUtils.ResolveWithError( "/localstorage:delete", err );
	}
};




/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////

export const ResponsesMap : ServerResponseMap = {

	'/ping' : <IResponseMethods>
	{
		post 	: pingResponse,
		get 	: pingResponse,
		put 	: pingResponse,
		patch 	: pingResponse,
		delete 	: pingResponse,
	},


	'/upload' : <IResponseMethods>
	{
		put 	: uploadResponse
	},

	'/download' : <IResponseMethods>
	{
		get 	: downloadResponse
	},

	'/storage' : <IResponseMethods>
	{
		get		: storage_Get,
		put 	: storage_Put,
		delete	: storage_Delete,
	},

};



