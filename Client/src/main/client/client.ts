
import * as http from 'http';

import { IClientRequestResult } from '../../../../Common/Interfaces'
import ServerConfigs from '../../../../Common/ServerConfigs'
import * as ClientWebSocket from './client.Modules.WebSocket';
import { IRequestsMethods, RequestsMap } from './client.Requests.Mapping';
import { IClientRequestInternalOptions } from './client.Requests.Processing';
import { ComProgress } from '../../../../Common/Utils/ComUtils';

const CommonOptions : http.RequestOptions = {
	host: '0.0.0.0',
	port: 3000,
	timeout : 500,
};

interface IClientRequest
{
	path : string;
	method : string;
	reqArgs : IClientRequestInternalOptions;
}


async function ProcessRequest( request : IClientRequest ) : Promise<Buffer|Error>
{
	const identifier : string = request.path;

	// Check if request is mapped
	const availableMethods : IRequestsMethods = RequestsMap[identifier];
	if ( !availableMethods )
	{
		const err = `Request "${request.path}" is not mapped`;
		console.error( err );
		return new Error( err );
	}

	// Check if method is defined
	const method : ( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) => Promise<IClientRequestResult> = availableMethods[request.method.toLowerCase()];
	if ( !method )
	{
		const err = `Request "${request.path}" failed\nMethod: ${request.method} for request ${identifier} is undefined`;
		console.error( err );
		return new Error( err );
	}
	
	// Execute the request
	const result : IClientRequestResult = await method( Object.assign({}, CommonOptions, request ), request.reqArgs );
	if ( result.bHasGoodResult )
	{
		console.log( `Request "${request.path}" satisfied\nResult: ${result.bHasGoodResult}\nBody: "${result.body.toString()}"` );
		return result.body;
	}
	else
	{
		const err = `Request "${request.path}" failed\nError:\n${result.body?.toString()}`;
		console.error( err );
		return new Error( err );
	}
}


export async function RequestServerPing() : Promise<Buffer|Error>
{
	return ProcessRequest( { path: '/ping', method: 'get', reqArgs: { Progress: undefined } } );
}


// Easy PUT and GET
export async function RequestGetData( Key : string, progress?: ComProgress ) : Promise<Buffer|Error>
{
	return ProcessRequest( { path: '/storage', method: 'get', reqArgs: { Storage:'local', Key : Key, Progress: progress } } );
}

export async function RequestPutData( Key : string, Value: any, progress?: ComProgress ) : Promise<Buffer|Error>
{
	return ProcessRequest( { path: '/storage', method: 'put', reqArgs: { Storage:'local', Key : Key, Value: Value, Progress: progress } } );
}


// STORAGE
export async function RequestStorageList( progress?: ComProgress ) : Promise<Buffer|Error>
{
	return ProcessRequest( { path: '/storage_list', method: 'get', reqArgs: { Storage:'local', Progress: progress } } );
}

export async function RequestResourceDownload( Identifier : string, DownloadLocation : string, progress?: ComProgress ) : Promise<Buffer|Error>
{
	return ProcessRequest( { path: '/download', method: 'get', reqArgs: { Identifier: Identifier, DownloadLocation : DownloadLocation, Progress: progress } } );
}

export async function RequestResourceUpload( AbsoluteFilePath : string, progress?: ComProgress ) : Promise<Buffer|Error>
{
	return ProcessRequest( { path: '/upload', method: 'put', reqArgs: { Identifier: AbsoluteFilePath, Progress: progress } } );
}


export async function InstallRequestsProcessor()
{
	let bResult = true;
	const serverConfigFilePath = '../Temp/ServerCfg.json';
	bResult = bResult && ServerConfigs.Load( serverConfigFilePath );
	if ( bResult )
	{
		CommonOptions.host = ServerConfigs.instance.PublicIPv4;
		CommonOptions.port = ServerConfigs.instance.RequestsListenerPort;
		const error = await ClientWebSocket.Client_SetupWebSocket();
		!error || console.error( error.name, error.message );
		bResult = bResult && !error;
	}
	return bResult;
}