
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

import * as mime from 'mime-types';

import FSUtils from '../../../../Common/Utils/FSUtils';
import { IClientRequestResult } from '../../../../Common/Interfaces';
import * as ComUtils from '../../../../Common/Utils/ComUtils';
import { ClientRequestsProcessing } from './client.Requests.Processing';


export interface IRequestsMethods
{
	[key:string] :( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) => Promise<IClientRequestResult>; 
	post? 		: ( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) => Promise<IClientRequestResult>;
	get? 		: ( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) => Promise<IClientRequestResult>;
	put? 		: ( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) => Promise<IClientRequestResult>;
	patch? 		: ( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) => Promise<IClientRequestResult>;
	delete? 	: ( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) => Promise<IClientRequestResult>;
}


export interface IClientRequestInternalOptions
{
	Identifier? : string;
	DownloadLocation?: string;
	Storage?: string;
	Key? : string;
	Value? : any;
	Headers? : Map<string, string | number | string[]>;
	FileStream? : fs.ReadStream;
}

/////////////////////////////////////////////////////////////////////////////////////////
const PingRequest = async ( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) =>
{
	return ClientRequestsProcessing.Request_GET( options, clientRequestInternalOptions );
};


/////////////////////////////////////////////////////////////////////////////////////////
/** Client -> Server */
const UploadResource = async ( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) =>
{
	const identifier = clientRequestInternalOptions.Identifier || '';
	
	// Check if file exists
	if ( fs.existsSync( identifier ) === false )
	{
		return ComUtils.ResolveWithError( "ClientRequests:UploadResource", `File ${identifier} doesn't exist` );
	}

	const filePathParsed = path.parse( identifier );

	// Headers
	clientRequestInternalOptions.Headers = new Map();
	{
		// Check if content type can be found
		// Considering https://stackoverflow.com/a/1176031 && https://stackoverflow.com/a/12560996 but appling https://stackoverflow.com/a/28652339
		const contentType : string = mime.lookup( filePathParsed.ext ) || 'application/octet-stream';
		clientRequestInternalOptions.Headers.set( 'content-type', contentType );
		
		// Check file Size
		const sizeInBytes : number | null = FSUtils.GetFileSizeInBytesOf( identifier );
		if ( sizeInBytes === null )
		{
			return ComUtils.ResolveWithError( "ClientRequests:UploadResource", `Cannot obtain size of file ${identifier}` );
		}
		clientRequestInternalOptions.Headers.set( 'content-length', sizeInBytes );
	}

	clientRequestInternalOptions.FileStream = fs.createReadStream( identifier );

	const requestPath = new URLSearchParams();
	requestPath.set('identifier', filePathParsed.base);
	options.path += '?' + requestPath.toString();

	return ClientRequestsProcessing.Request_PUT( options, clientRequestInternalOptions );
};

/////////////////////////////////////////////////////////////////////////////////////////
/** Server -> Client */
const DownloadResource = async ( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) =>
{
	const { DownloadLocation, Identifier } = clientRequestInternalOptions;

	const requestPath = new URLSearchParams();
	requestPath.set('identifier', Identifier);
	options.path += '?' + requestPath.toString();
	options.method = 'get';

	const result : IClientRequestResult = await ClientRequestsProcessing.Request_GET( options, <IClientRequestInternalOptions>{} );
	if ( !result.bHasGoodResult )
	{
		return result;
	}

	const writeError : NodeJS.ErrnoException = await new Promise( ( resolve ) =>
	{
		FSUtils.EnsureDirectoryExistence(DownloadLocation);
		fs.writeFile( path.join( DownloadLocation, Identifier ), result.body, function( err : NodeJS.ErrnoException )
		{
			resolve( err );
		});
	});
	if ( writeError )
	{
		if ( FSUtils.ExistsSync( Identifier ) )
		{
			fs.unlinkSync( Identifier );
		}
		return ComUtils.ResolveWithError( `ClientRequests:DownloadResource`, `Download request of ${Identifier} failed\n${writeError}` );
	}
	return ComUtils.ResolveWithGoodResult<IClientRequestResult>( Buffer.from( "Done" ) );
};


/////////////////////////////////////////////////////////////////////////////////////////



/////////////////////////////////////////////////////////////////////////////////////////
const Storage_Get = async ( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) =>
{
	return ClientRequestsProcessing.Request_GET( options, clientRequestInternalOptions );
};

/////////////////////////////////////////////////////////////////////////////////////////
const Storage_Put = async ( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) =>
{
	return ClientRequestsProcessing.Request_GET( options, clientRequestInternalOptions );
};

/////////////////////////////////////////////////////////////////////////////////////////
const Storage_Delete = async ( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) =>
{
	return ClientRequestsProcessing.Request_GET( options, clientRequestInternalOptions );
};

/////////////////////////////////////////////////////////////////////////////////////////
const Storage_List = async ( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) =>
{
	return ClientRequestsProcessing.Request_GET( options, clientRequestInternalOptions );
};

/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////

interface ServerResponseMap
{
	[key:string] : IRequestsMethods
}

export const RequestsMap : ServerResponseMap = {

	'/ping'			: <IRequestsMethods>
	{
		get 		: PingRequest,
	},

	'/upload' 		: <IRequestsMethods>
	{
		put			: UploadResource,
	},

	'/download' 	: <IRequestsMethods>
	{
		get 		: DownloadResource,
	},

	'/storage'		: <IRequestsMethods>
	{
		get			: Storage_Get,
		put			: Storage_Put,
		delete		: Storage_Delete,
	},

	'/storage_list'	: <IRequestsMethods>
	{
		get			: Storage_List,
	},
}