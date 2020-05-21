
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path'

import * as ComUtils from '../../../Common/Utils/ComUtils';
import * as mime from 'mime-types';

import FSUtils from '../../../Common/Utils/FSUtils';

import ServerResponsesProcessing, { IServerRequestInternalOptions } from "./Server.Responses.Processing";
import { IServerStorage, StorageManager } from "../Server.Storages";
import { DOWNLOAD_LOCATION } from '../Server.Globals';
import { HTTPCodes } from "../HTTP.Codes";


export const NotImplementedResponse = async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<ComUtils.IServerResponseResult> =>
{
	const options = <IServerRequestInternalOptions>
	{
		Value : Buffer.from( HTTPCodes[404] )
	}
	const result : ComUtils.IServerResponseResult = await ServerResponsesProcessing.Request_GET( request, response, options );
	result.bHasGoodResult = false; // bacause in any case on server we want register as failure
	return result;
};


export const MethodNotAllowed = async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<ComUtils.IServerResponseResult> =>
{
	const options = <IServerRequestInternalOptions>
	{
		Value : Buffer.from( HTTPCodes[405] )
	};
	const result : ComUtils.IServerResponseResult = await ServerResponsesProcessing.Request_GET( request, response, options );
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


/////////////////////////////////////////////////////////////////////////////////////////
const PingResponse = async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<ComUtils.IServerResponseResult> =>
{
	const options = <IServerRequestInternalOptions>
	{
		Value : Buffer.from( 'Ping Response' )
	};
	const result : ComUtils.IServerResponseResult = await ServerResponsesProcessing.Request_GET( request, response, options );
	return result;
};

/////////////////////////////////////////////////////////////////////////////////////////
/** Client -> Server */
const UploadResource = async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<ComUtils.IServerResponseResult> =>
{
	// Execute file upload to client
	const searchParams = new URLSearchParams( request.url.split('?')[1] );
	const identifier = searchParams.get( 'identifier' );
	const options = <IServerRequestInternalOptions>
	{
		
	};

	const result : ComUtils.IServerResponseResult = await ServerResponsesProcessing.Request_PUT( request, response, options );
	if ( !result.bHasGoodResult )
	{
		return result;
	}
	
	const filePath = path.join( DOWNLOAD_LOCATION, identifier );
	const bHasWriteGoodResult : boolean = await new Promise( ( resolve ) =>
	{
		FSUtils.EnsureDirectoryExistence( DOWNLOAD_LOCATION );
		fs.writeFile( filePath, result.body, function( err: NodeJS.ErrnoException | null )
		{
			resolve( !err );
		});
	});
	if ( !bHasWriteGoodResult )
	{
		return ComUtils.ResolveWithError( `File Upload Failed`, `Upload request of ${identifier} failed` );
	}
	ServerResponsesProcessing.EndResponseWithGoodResult( response );
	return ComUtils.ResolveWithGoodResult( result.body );
};

/////////////////////////////////////////////////////////////////////////////////////////
/** Server -> Client */
const DownloadResource = async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<ComUtils.IServerResponseResult> =>
{
	// Execute file download server side
	const searchParams = new URLSearchParams( request.url.split('?')[1] );
	const identifier = searchParams.get( 'identifier' );
	const serverRequestInternalOptions = <IServerRequestInternalOptions>
	{
		Identifier : identifier
	};

	const filePath = path.join( DOWNLOAD_LOCATION, identifier );

	// Check if file exists
	if ( !(await FSUtils.FileExistsAsync( filePath ) ))
	{
		const err = `Resource ${identifier} doesn't exist`;
		ServerResponsesProcessing.EndResponseWithError( response, err, 404 );
		return ComUtils.ResolveWithError( "ServerResponses:DownloadResource", err );
	}

	serverRequestInternalOptions.Headers = {};
	{
		// Check if content type can be found
		const contentType : string = mime.lookup( path.parse(filePath).ext ) || 'application/octet-stream';
		serverRequestInternalOptions.Headers['content-type'] = contentType;

		// Check file Size
		const sizeInBytes : number | null = FSUtils.GetFileSizeInBytesOf( filePath );
		if ( sizeInBytes === null )
		{
			const err = `Cannot obtain size of file ${filePath}`;
			ServerResponsesProcessing.EndResponseWithError( response, err, 400 );
			return ComUtils.ResolveWithError( "ServerResponses:DownloadResource", err );
		}
		serverRequestInternalOptions.Headers['content-length'] = sizeInBytes;
	}

	serverRequestInternalOptions.FileStream = fs.createReadStream( filePath );

	return ServerResponsesProcessing.Request_GET( request, response, serverRequestInternalOptions );
};


/////////////////////////////////////////////////////////////////////////////////////////



/////////////////////////////////////////////////////////////////////////////////////////
const Storage_Get = async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<ComUtils.IServerResponseResult> =>
{
	const searchParams = new URLSearchParams( request.url.split('?')[1] );
	const key = searchParams.get( 'key' );
	const storageID = searchParams.get( 'stg' );
	const storage : IServerStorage = StorageManager.GetStorage( storageID );
	if( !storage )
	{
		const err = `Storage "${storageID}" Not Found`;
		ServerResponsesProcessing.EndResponseWithError( response, err, 404 );
		return ComUtils.ResolveWithError( "/localstorage:get", err );
	}

	if( !key )
	{
		const err = `Storage Get: Invalid Key`;
		ServerResponsesProcessing.EndResponseWithError( response, err, 404 );
		return ComUtils.ResolveWithError( "/localstorage:get", err );
	}

	const options = <IServerRequestInternalOptions>
	{
		Key : key,
		Value : await storage.GetResource( key )
	};
	return ServerResponsesProcessing.Request_GET( request, response, options );
};

/////////////////////////////////////////////////////////////////////////////////////////
const Storage_Put = async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<ComUtils.IServerResponseResult> =>
{
	const searchParams = new URLSearchParams( request.url.split('?')[1] );
	const key = searchParams.get( 'key' );
	const storageID = searchParams.get( 'stg' );
	const storage : IServerStorage = StorageManager.GetStorage( storageID );
	if( !storage )
	{
		const err = `Storage "${storageID}" Not Found`;
		ServerResponsesProcessing.EndResponseWithError( response, err, 404 );
		return ComUtils.ResolveWithError( "/localstorage:put", err );
	}

	const options = <IServerRequestInternalOptions>
	{
		Key : key
	};
	const result : ComUtils.IServerResponseResult = await ServerResponsesProcessing.Request_PUT( request, response, options );
	if ( result.bHasGoodResult )
	{
		await storage.AddResource( key, result.body, true );
	}
	return result;
};

/////////////////////////////////////////////////////////////////////////////////////////
const Storage_Delete = async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<ComUtils.IServerResponseResult> =>
{
	const parsedUrl = new URL( request.url );
	const key = parsedUrl.searchParams.get( 'key' );
	const storageID = parsedUrl.searchParams.get( 'stg' );
	const storage : IServerStorage = StorageManager.GetStorage( storageID );
	if( !storage )
	{
		const err = `Storage "${storageID}" Not Found`;
		ServerResponsesProcessing.EndResponseWithError( response, err, 404 );
		return ComUtils.ResolveWithError( "/localstorage:delete", err );
	}

	if ( await storage.HasResource( key ) )
	{
		if( !await storage.RemoveResource( key ) )
		{
			const err = `Cannot remove "${key}" from "${storageID}"`;
			ServerResponsesProcessing.EndResponseWithError( response, err, 500 );
			return ComUtils.ResolveWithError( "/localstorage:delete", err );
		}
		ServerResponsesProcessing.EndResponseWithGoodResult( response );
		return ComUtils.ResolveWithGoodResult( Buffer.from( HTTPCodes[200] ) );
	}
	else
	{
		const err = `Entry "${key}" not found`;
		ServerResponsesProcessing.EndResponseWithError( response, err, 404 );
		return ComUtils.ResolveWithError( "/localstorage:delete", err );
	}
};

/////////////////////////////////////////////////////////////////////////////////////////
const Storage_List = async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<ComUtils.IServerResponseResult> =>
{
	const searchParams = new URLSearchParams( request.url.split('?')[1] );
	const storageID = searchParams.get( 'stg' );
	const storage : IServerStorage = StorageManager.GetStorage( storageID );
	if( !storage )
	{
		const err = `Storage "${storageID}" Not Found`;
		ServerResponsesProcessing.EndResponseWithError( response, err, 404 );
		return ComUtils.ResolveWithError( "/localstorage:get", err );
	}
	const list : string[] = await storage.ListResources();
	ServerResponsesProcessing.EndResponseWithGoodResult( response, JSON.stringify(list) );
	return ComUtils.ResolveWithGoodResult( Buffer.from( HTTPCodes[200] ) );
};




/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////

interface ServerResponsesMap
{
	[key:string] : IResponseMethods
}

export const ResponsesMap : ServerResponsesMap =
{
	'/ping' 		: <IResponseMethods>
	{
		post 		: PingResponse,
		get 		: PingResponse,
		put 		: PingResponse,
		patch 		: PingResponse,
		delete 		: PingResponse,
	},


	'/upload' 		: <IResponseMethods>
	{
		put 		: UploadResource,
	},

	'/download' 	: <IResponseMethods>
	{
		get 		: DownloadResource,
	},

	'/storage' 		: <IResponseMethods>
	{
		get			: Storage_Get,
		put 		: Storage_Put,
		delete		: Storage_Delete,
	},

	'/storage_list'	: <IResponseMethods>
	{
		get 		: Storage_List,
	}
};