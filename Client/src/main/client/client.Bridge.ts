
import * as http from 'http';

import { IClientRequestResult, EHeaders } from '../../../../Common/Interfaces'
import ServerConfigs from '../../../../Common/ServerConfigs'
import * as ClientWebSocket from './client.Modules.WebSocket';
import { IRequestsMethods, RequestsMap } from './client.Requests.Mapping';
import { IClientRequestInternalOptions } from './client.Requests.Processing';
import { ComFlowManager } from '../../../../Common/Utils/ComUtils';

const CommonOptions : http.RequestOptions = {
	host: '0.0.0.0',
	port: 3000,
	timeout : 10000,
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


export async function Request_ServerPing() : Promise<Buffer|Error>
{
	return ProcessRequest( { path: '/ping', method: 'get', reqArgs: { ComFlowManager: undefined } } );
}

/** Register Request */
export async function Request_UserRegister( Username: string, Password: string ) : Promise<Buffer|Error>
{	
	const Headers : http.IncomingHttpHeaders =
	{
		[EHeaders.USERNAME] : Username,
		[EHeaders.PASSWORD] : Password
	};
	return ProcessRequest( { path: '/user_register', method: 'put', reqArgs: { Headers } } );
}
/** Login Request */
export async function Request_UserLogin( Username: string, Password: string ) : Promise<Buffer|Error>
{
	// TODO Get token by username and password on this machine
	const Headers : http.IncomingHttpHeaders =
	{
		[EHeaders.USERNAME] : Username,
		[EHeaders.PASSWORD] : Password
	};
	return ProcessRequest( { path: '/user_login', method: 'put', reqArgs: { Headers } } );
}
/** Login by token request */
export async function Request_UserLoginByToken( Token: string ): Promise<Buffer|Error>
{
	const Headers : http.IncomingHttpHeaders =
	{
		'token': Token,
	};
	return ProcessRequest( { path: '/user_login_token', method: 'put', reqArgs: { Headers } } );
}

/** Logout Request */
export async function Request_UserLogout( Token: string ): Promise<Buffer|Error>
{
	const Headers : http.IncomingHttpHeaders =
	{
		'token': Token,
	};
	return ProcessRequest( { path: '/user_logout', method: 'put', reqArgs: { Headers } } );
}

const RetrieveToken = async () => (await customLocalStorage.GetResource('token')).toString() 

// STORAGE
export async function Request_StorageGetData( ComFlowManager: ComFlowManager, Key : string ) : Promise<Buffer|Error>
{
	const Headers : http.IncomingHttpHeaders =
	{
		'token': await RetrieveToken(),
		'storage': 'local', 
		'key' : Key
	};
	return ProcessRequest( { path: '/storage', method: 'get', reqArgs: { ComFlowManager, Headers } } );
}
export async function Request_StoragePutData( ComFlowManager: ComFlowManager, Key : string, Value: any ) : Promise<Buffer|Error>
{
	const Headers : http.IncomingHttpHeaders =
	{
		'token': await RetrieveToken(),
		'storage': 'local', 
		'key' : Key
	};
	return ProcessRequest( { path: '/storage', method: 'put', reqArgs: { Value, ComFlowManager, Headers } } );
}
export async function Request_StorageList( ComFlowManager: ComFlowManager ) : Promise<Buffer|Error>
{
	const Headers : http.IncomingHttpHeaders =
	{
		'token': await RetrieveToken(),
		'storage': 'local'
	};
	return ProcessRequest( { path: '/storage_list', method: 'get', reqArgs: { ComFlowManager, Headers } } );
}
export async function Request_ResourceDownload( ComFlowManager: ComFlowManager, Identifier : string, DownloadLocation : string ) : Promise<Buffer|Error>
{
	const Headers : http.IncomingHttpHeaders =
	{
		'token': await RetrieveToken(),
		'identifier': Identifier
	};
	return ProcessRequest( { path: '/download', method: 'get', reqArgs: { DownloadLocation, ComFlowManager, Headers } } );
}
export async function Request_ResourceUpload( ComFlowManager: ComFlowManager, AbsoluteFilePath : string ) : Promise<Buffer|Error>
{
	const Headers : http.IncomingHttpHeaders =
	{
		'token': await RetrieveToken(),
		'identifier': AbsoluteFilePath
	};
	return ProcessRequest( { path: '/upload', method: 'put', reqArgs: { ComFlowManager, Headers } } );
}


export async function InstallRequestsProcessor()
{
	let bResult = true;
	const bIsDev = process.env.NODE_ENV === 'development'; //TODO Remove this workaround
	CommonOptions.timeout = bIsDev ? undefined : CommonOptions.timeout;

	const serverConfigFilePath = (bIsDev ? '' : '../../' ) + '../Temp/ServerCfg.json';
//	console.log(serverConfigFilePath);
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