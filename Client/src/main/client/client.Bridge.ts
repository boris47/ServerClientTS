
import * as http from 'http';

import { IClientRequestResult, EHeaders, EMappedPaths } from '../../../../Common/Interfaces'
import ServerConfigs from '../../../../Common/ServerConfigs'
import * as ClientWebSocket from './client.Modules.WebSocket';
import { IRequestsMethods, RequestsMap } from './client.Requests.Map';
import { IClientRequestInternalOptions } from './client.Requests.Processing';
import { ComFlowManager } from '../../../../Common/Utils/ComUtils';
import FS_Storage from '../../../../Common/FS_Storage';

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
	const identifier = request.path;

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
		console.log( `Request "${request.path}", method "${request.method}" satisfied\nResult: ${result.bHasGoodResult}\nBody: "${result.body.toString()}"` );
		return result.body;
	}
	else
	{
		const err = `Request "${request.path}" failed\nError:\n${result.body?.toString()}`;
	//	console.error( err );
		return new Error( err );
	}
}

/** Register Request */
export async function Request_UserRegister( Username: string, Password: string ) : Promise<Buffer|Error>
{	
	const Headers : http.IncomingHttpHeaders =
	{
		[EHeaders.USERNAME] : Username,
		[EHeaders.PASSWORD] : Password
	};
	return ProcessRequest( { path: EMappedPaths.USER, method: 'put', reqArgs: { Headers } } );
}
/** Login Request */
export async function Request_UserLogin( Username: string, Password: string ) : Promise<Buffer|Error>
{
	const Headers : http.IncomingHttpHeaders =
	{
		[EHeaders.USERNAME] : Username,
		[EHeaders.PASSWORD] : Password
	};
	const result = await ProcessRequest( { path: EMappedPaths.USER, method: 'get', reqArgs: { Headers } } );
	if (Buffer.isBuffer(result))
	{
		await FS_Storage.AddResource( 'accessToken', result );
		await FS_Storage.SaveStorage();
	}
	return result;
}
/** Login by token request */
export async function Request_UserLoginByToken( Token: string ): Promise<Buffer|Error>
{
	const Headers : http.IncomingHttpHeaders =
	{
		[EHeaders.TOKEN]: Token,
	};
	return ProcessRequest( { path: EMappedPaths.USER, method: 'get', reqArgs: { Headers } } );
}
/** Logout Request */
export async function Request_UserLogout( Token: string ): Promise<Buffer|Error>
{
	const Headers : http.IncomingHttpHeaders =
	{
		[EHeaders.TOKEN]: Token,
	};
	await FS_Storage.RemoveResource( 'accessToken' );
	await FS_Storage.SaveStorage();
	return ProcessRequest( { path: EMappedPaths.USER, method: 'post', reqArgs: { Headers } } );
}

const RetrieveToken = async () => (await FS_Storage.GetResource('accessToken')).toString() 

// STORAGE
export async function Request_StorageGetData( ComFlowManager: ComFlowManager, Key : string ) : Promise<Buffer|Error>
{
	const Headers : http.IncomingHttpHeaders =
	{
		[EHeaders.TOKEN]: await RetrieveToken(),
		[EHeaders.KEY]: Key
	};
	return ProcessRequest( { path: EMappedPaths.STORAGE, method: 'get', reqArgs: { ComFlowManager, Headers } } );
}
export async function Request_StoragePutData( ComFlowManager: ComFlowManager, Key : string, Value: any ) : Promise<Buffer|Error>
{
	const Headers : http.IncomingHttpHeaders =
	{
		[EHeaders.TOKEN]: await RetrieveToken(),
		[EHeaders.KEY]: Key
	};
	return ProcessRequest( { path: EMappedPaths.STORAGE, method: 'put', reqArgs: { Value, ComFlowManager, Headers } } );
}


export async function Request_ResourceDownload( ComFlowManager: ComFlowManager, Identifier : string, DownloadLocation : string ) : Promise<Buffer|Error>
{
	const Headers : http.IncomingHttpHeaders =
	{
		[EHeaders.TOKEN]: await RetrieveToken(),
		[EHeaders.IDENTIFIER]: Identifier
	};
	return ProcessRequest( { path: EMappedPaths.RESOURCE, method: 'get', reqArgs: { DownloadLocation, ComFlowManager, Headers } } );
}
export async function Request_ResourceUpload( ComFlowManager: ComFlowManager, AbsoluteFilePath : string ) : Promise<Buffer|Error>
{
	const Headers : http.IncomingHttpHeaders =
	{
		[EHeaders.TOKEN]: await RetrieveToken(),
		[EHeaders.IDENTIFIER]: AbsoluteFilePath
	};
	return ProcessRequest( { path: EMappedPaths.RESOURCE, method: 'put', reqArgs: { ComFlowManager, Headers } } );
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