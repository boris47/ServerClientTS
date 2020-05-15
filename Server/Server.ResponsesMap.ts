
import * as http from 'http';
import * as fs from 'fs';

import { AsyncHttpResponse } from "./HttpResponse";
import { HTTPCodes } from "./HTTP.Codes";

import { ServerResponses } from "./Server.Responses";
import * as ComUtils from '../Common/Utils/ComUtils';
import { IServerStorage, StorageManager } from "./Server.Storages";


export const NotImplementedResponse = new AsyncHttpResponse( async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<ComUtils.IServerResponseResult> =>
{
	const options = <IServerRequestInternalOptions>
	{
		Value : Buffer.from( HTTPCodes[404] )
	}
	const result : ComUtils.IServerResponseResult = await ServerResponses.Request_GET( request, response, options );
	result.bHasGoodResult = false; // bacause in any case on server we want register as failure
	return result;
});


export const MethodNotAllowed = new AsyncHttpResponse( async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<ComUtils.IServerResponseResult> =>
{
	const options = <IServerRequestInternalOptions>
	{
		Value : Buffer.from( HTTPCodes[405] )
	};
	const result : ComUtils.IServerResponseResult = await ServerResponses.Request_GET( request, response, options );
	result.bHasGoodResult = false; // bacause in any case on server we want register as failure
	return result;
});

export interface IResponseMethods
{
	[key:string]: () => AsyncHttpResponse;
	post? 		: () => AsyncHttpResponse;
	get? 		: () => AsyncHttpResponse;
	put? 		: () => AsyncHttpResponse;
	patch? 		: () => AsyncHttpResponse;
	delete? 	: () => AsyncHttpResponse;
}

export interface IServerRequestInternalOptions
{
	Identifier? : string;
	Key? : string;
	Value? : Buffer | null;
	Headers? : http.OutgoingHttpHeaders;
	FileStream? : fs.ReadStream;
}



interface ServerResponseMap
{
	[key:string] : IResponseMethods
}

/////////////////////////////////////////////////////////////////////////////////////////
const pingResponse = () => new AsyncHttpResponse( async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<ComUtils.IServerResponseResult> =>
{
	const options = <IServerRequestInternalOptions>
	{
		Value : Buffer.from( 'Ping Response' )
	};
	const result : ComUtils.IServerResponseResult = await ServerResponses.Request_GET( request, response, options );
	return result;
});


/////////////////////////////////////////////////////////////////////////////////////////
/** Client -> Server */
const uploadResponse = () => new AsyncHttpResponse( async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<ComUtils.IServerResponseResult> =>
{
	// Execute file upload to client
	const searchParams = new URLSearchParams( request.url.split('?')[1] );
	const identifier = searchParams.get( 'identifier' );
	const options = <IServerRequestInternalOptions>
	{
		Identifier : identifier
	};
	return ServerResponses.DownloadFile( request, response, options );
});

/////////////////////////////////////////////////////////////////////////////////////////
/** Server -> Client */
const downloadResponse = () => new AsyncHttpResponse( async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<ComUtils.IServerResponseResult> =>
{
	// Execute file download server side
	const searchParams = new URLSearchParams( request.url.split('?')[1] );
	const identifier = searchParams.get( 'identifier' );
	const options = <IServerRequestInternalOptions>
	{
		Identifier : identifier
	};
	return ServerResponses.UploadFile( request, response, options );
});

/////////////////////////////////////////////////////////////////////////////////////////
const storage_list = () => new AsyncHttpResponse( async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<ComUtils.IServerResponseResult> =>
{
	const searchParams = new URLSearchParams( request.url.split('?')[1] );
	const storageID = searchParams.get( 'stg' );
	const storage : IServerStorage = StorageManager.GetStorage( storageID );
	if( !storage )
	{
		const err = `Storage "${storageID}" Not Found`;
		ServerResponses.EndResponseWithError( response, err, 404 );
		return ComUtils.ResolveWithError( "/localstorage:get", err );
	}
	const list : string[] = await storage.ListResources();
	ServerResponses.EndResponseWithGoodResult( response, JSON.stringify(list) );
	return ComUtils.ResolveWithGoodResult( Buffer.from( HTTPCodes[200] ) );
});

/////////////////////////////////////////////////////////////////////////////////////////
const storage_Get = () => new AsyncHttpResponse( async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<ComUtils.IServerResponseResult> =>
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

	if( !key )
	{
		const err = `Storage Get: Invalid Key`;
		ServerResponses.EndResponseWithError( response, err, 404 );
		return ComUtils.ResolveWithError( "/localstorage:get", err );
	}

	const options = <IServerRequestInternalOptions>
	{
		Key : key,
		Value : await storage.GetResource( key )
	};
	return ServerResponses.Request_GET( request, response, options );
});

/////////////////////////////////////////////////////////////////////////////////////////
const storage_Put = () => new AsyncHttpResponse( async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<ComUtils.IServerResponseResult> =>
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
		await storage.AddResource( key, result.body, true );
	}
	return result;
});

/////////////////////////////////////////////////////////////////////////////////////////
const storage_Delete = () => new AsyncHttpResponse( async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<ComUtils.IServerResponseResult> =>
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
});




/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////

export const ResponsesMap : ServerResponseMap =
{
	'/ping' 		: <IResponseMethods>
	{
		post 		: pingResponse,
		get 		: pingResponse,
		put 		: pingResponse,
		patch 		: pingResponse,
		delete 		: pingResponse,
	},


	'/upload' 		: <IResponseMethods>
	{
		put 		: uploadResponse,
	},

	'/download' 	: <IResponseMethods>
	{
		get 		: downloadResponse,
	},

	'/storage' 		: <IResponseMethods>
	{
		get			: storage_Get,
		put 		: storage_Put,
		delete		: storage_Delete,
	},

	'/storage_list'	: <IResponseMethods>
	{
		get 		: storage_list,
	}
};



