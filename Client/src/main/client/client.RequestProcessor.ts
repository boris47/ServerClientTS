
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

import { IServerConfigs, IClientRequestResult } from '../../../../Common/Interfaces'
import { IClientRequestInternalOptions } from './Client.Requests';
import * as ClientWebSocket from './Client.WebSocket';
import { IRequestsMethods, RequestsMap } from './Client.RequestsMap';


let serverPublicIp = "0.0.0.0";// "0.0.0.0";
const serverConfigFileName = './ServerCfg.json';
if ( fs.existsSync( serverConfigFileName ) )
{
	const fileContent = fs.readFileSync( serverConfigFileName, 'utf8' );
	const fileJson : IServerConfigs = JSON.parse( fileContent );
	serverPublicIp = fileJson.PublicIP || serverPublicIp;
}

const CommonOptions : http.RequestOptions = {
	host: `${serverPublicIp}`,
	port: 3000,
	timeout : 500,
};


type ResolveDelegate = ( body : Buffer ) => void;
type RejectDelegate = ( err : Error ) => void;

interface IClientRequest {
	path : string;
	method : string;
	reqArgs : IClientRequestInternalOptions;
	OnResolve : ResolveDelegate | null;
	OnReject : RejectDelegate | null;
}



async function ProcessRequest( request : IClientRequest ) : Promise<void>
{
	const identifier : string = request.path;

	// Check if request is mapped
	const availableMethods : IRequestsMethods = RequestsMap[identifier];
	if ( !availableMethods )
	{
		const err = `Request "${request.path}" is not mapped`;
		console.error( err );
		return request.OnReject?.call( request, new Error( err ) );
	}

	// Check if method is defined
	const method : ( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) => Promise<IClientRequestResult> = availableMethods[request.method.toLowerCase()];
	if ( !method )
	{
		const err = `Request "${request.path}" failed\nMethod: ${request.method} for request ${identifier} is undefined`;
		console.error( err );
		return request.OnReject?.call( request, new Error( err ) );
	}
	
	// Execute the request
	const options = Object.assign({}, CommonOptions, request );
	const result : IClientRequestResult = await method( options, request.reqArgs );
	if ( result.bHasGoodResult )
	{
		console.log( `Request "${request.path}" satisfied\nResult: ${result.bHasGoodResult}` );
		return request.OnResolve?.call( request, result.body );
	}
	else
	{
		const err = `Request "${request.path}" failed\nError:\n${result.body?.toString()}`;
		console.error( err );
		return request.OnReject?.call( request, new Error( err ) );
	}
}


async function Request( path : string, method : string, args:IClientRequestInternalOptions = {}, OnResolve : null | ResolveDelegate = null, OnReject : null | RejectDelegate = null ) : Promise<void>
{
	const newRequest : IClientRequest =
	{
		path : path,
		method : method.toLowerCase(),
		reqArgs : args,
		OnResolve : OnResolve,
		OnReject : OnReject
	};

	return ProcessRequest( newRequest );
}


export async function RequestServerPing() : Promise<boolean>
{
	return new Promise<boolean>(( resolve : (value: boolean) => void ) =>
	{
		Request( '/ping', 'get', <IClientRequestInternalOptions>{},
			( body: Buffer ) =>
			{
				resolve( true );
			},
			( err: Error ) =>
			{
				resolve( false );
			}
		);
	});
}


export async function RequestGetData( Key : string ) : Promise<Buffer|Error>
{
	return new Promise<Buffer|Error>(( resolve ) =>
	{
		Request( '/storage', 'get', <IClientRequestInternalOptions>{ Storage:'local', Key : Key },
			( body: Buffer ) => resolve(body),
			( err: Error ) => resolve(err)
		);
	});
}

export async function RequestPutData( Key : string, Value: any ) : Promise<Buffer|Error>
{
	return new Promise<Buffer|Error>(( resolve ) =>
	{
		Request( '/storage', 'put', <IClientRequestInternalOptions>{ Storage:'local', Key : Key, Value: Value },
			( body: Buffer ) => resolve(body),
			( err: Error ) => resolve(err)
		);
	});
}

export async function RequestFileDownload( FileName : string, DownloadLocation : string ) : Promise<Buffer|Error>
{
	return new Promise<Buffer|Error>(( resolve ) =>
	{
		Request( '/download', 'get', <IClientRequestInternalOptions>{ AbsoluteFilePath: path.join(DownloadLocation, FileName) },
			( body: Buffer ) => resolve(body),
			( err: Error ) => resolve(err)
		);
	});
}

export async function RequestFileUpload( AbsoluteFilePath : string ) : Promise<Buffer|Error>
{
	return new Promise<Buffer|Error>(( resolve ) =>
	{
		Request( '/upload', 'put', <IClientRequestInternalOptions>{ AbsoluteFilePath: AbsoluteFilePath },
			( body: Buffer ) => resolve(body),
			( err: Error ) => resolve(err)
		);
	});
}


/** Should set serverPublicIp and port */
export async function InstallRequestsProcessor( ServerIp?: string, Port?: number )
{
	const bResult = await ClientWebSocket.Client_SetupWebSocket();
	

	return bResult;
}