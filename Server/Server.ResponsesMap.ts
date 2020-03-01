
import * as http from 'http';
import * as fs from 'fs';

import { AsyncHttpResponse } from "./HttpResponse";
import { HTTPCodes } from "./HTTP.Codes";
import { IServerResponseResult } from "../Common/Interfaces";
import { ServerResponses } from "./Server.Responses";
import * as ComUtils from '../Common/ComUtils';
import { IServerStorage, StorageManager } from "./Server.Storages";
import * as GenericUtils from '../Common/GenericUtils';

export const NotImplementedResponse = new AsyncHttpResponse( async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<IServerResponseResult> =>
{
	const options = <IServerRequestInternalOptions>
	{
		Value : GenericUtils.ToBuffer( HTTPCodes[404] )
	}
	const result : IServerResponseResult = await ServerResponses.Request_GET( request, response, options );
	return result;
});


export const MethodNotAllowed = new AsyncHttpResponse( async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<IServerResponseResult> =>
{
	const options = <IServerRequestInternalOptions>
	{
		Value : GenericUtils.ToBuffer( HTTPCodes[405] )
	};
	const result : IServerResponseResult = await ServerResponses.Request_GET( request, response, options );
	return result;
});

export interface IResponseMethods
{
	post? 		: () => AsyncHttpResponse;
	get? 		: () => AsyncHttpResponse;
	put? 		: () => AsyncHttpResponse;
	patch? 		: () => AsyncHttpResponse;
	delete? 	: () => AsyncHttpResponse;
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
const pingResponse = () => new AsyncHttpResponse( async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<IServerResponseResult> =>
{
	const options = <IServerRequestInternalOptions>
	{
		Value : GenericUtils.ToBuffer( 'Ping Response' )
	};
	const result : IServerResponseResult = await ServerResponses.Request_GET( request, response, options );
	return result;
});


/////////////////////////////////////////////////////////////////////////////////////////
const uploadResponse = () => new AsyncHttpResponse( async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<IServerResponseResult> =>
{
	// Execute file upload to client
	const fileName = request.url.split('=')[1];
	const options = <IServerRequestInternalOptions>
	{
		FileName : fileName
	};
	return await ServerResponses.DownloadFile( request, response, options );
});

/////////////////////////////////////////////////////////////////////////////////////////
const downloadResponse = () => new AsyncHttpResponse( async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<IServerResponseResult> =>
{
	// Execute file download server side
	const fileName = request.url.split('=')[1];
	const options = <IServerRequestInternalOptions>
	{
		FileName : fileName
	};
	return await ServerResponses.UploadFile( request, response, options );
});

/////////////////////////////////////////////////////////////////////////////////////////
const storage_Get = () => new AsyncHttpResponse( async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<IServerResponseResult> =>
{
	const parseResults = GenericUtils.URl_Parse( request.url );
	const key = parseResults.KeyValues.get( 'key' );
	const storageID = parseResults.KeyValues.get( 'stg' );
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
});

/////////////////////////////////////////////////////////////////////////////////////////
const storage_Put = () => new AsyncHttpResponse( async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<IServerResponseResult> =>
{
	const parseResults = GenericUtils.URl_Parse( request.url );
	const key = parseResults.KeyValues.get( 'key' );
	const storageID = parseResults.KeyValues.get( 'stg' );
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
	const result : IServerResponseResult = await ServerResponses.Request_PUT( request, response, options );
	if ( result.bHasGoodResult )
	{
		await storage.AddResource( key, result.body, false );
	}
	return result;
});

/////////////////////////////////////////////////////////////////////////////////////////
const storage_Delete = () => new AsyncHttpResponse( async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<IServerResponseResult> =>
{
	const parseResults = GenericUtils.URl_Parse( request.url );
	const key = parseResults.KeyValues.get( 'key' );
	const storageID = parseResults.KeyValues.get( 'stg' );
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



