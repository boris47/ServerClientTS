
import * as http from 'http';

import { EHeaders, EMappedPaths } from '../../../../Common/Interfaces'
import ServerConfigs from '../../../../Common/ServerConfigs'
//import WebSocketManager from './client.Modules.WebSocket';
import { IRequestsMethods, RequestsMap } from './client.Requests.Map';
import { IClientRequestInternalOptions } from './client.Requests.Processing';
import { ComFlowManager } from '../../../../Common/Utils/ComUtils';
import FS_Storage from '../../../../Common/FS_Storage';

const CommonOptions: http.RequestOptions =
{
	host: '0.0.0.0',
	port: 3000,
	timeout: 10000,
};

interface IClientRequest
{
	path: string;
	method: string;
	clientRequestInternalOptions: IClientRequestInternalOptions;
}


async function ProcessRequest( request: IClientRequest ): Promise<Buffer|Error>
{
	const { path, method, clientRequestInternalOptions } = request;
	delete request.clientRequestInternalOptions;

	// Check if request is mapped
	const availableMethods: IRequestsMethods = RequestsMap[path];
	if ( !availableMethods )
	{
		const err = `Request "${path}" is not mapped`;
		console.error( err );
		return new Error( err );
	}

	// Check if method is defined
	const executor = availableMethods[method.toLowerCase()];
	if ( !executor )
	{
		const err = `Request "${path}":[${method}] cannot find method!`;
		console.error( err );
		return new Error( err );
	}
	
	console.log(`Executing Path: '${path}', Method: '${method}'`);

	// Execute the request
	const result: Error | Buffer = await executor( Object.assign({}, CommonOptions, request ), clientRequestInternalOptions );
	if ( Buffer.isBuffer(result) )
	{
		console.log( `Request '${path}', Method '${method}', Context '${executor.name}', satisfied\n\tBody: "${result.toString()}"\n` );
		return result;
	}
	else
	{
		const errMsg = `\nRequest '${path}', Method '${method}', Context '${executor.name}', failed\nError:\n${result}`;
		console.error(errMsg);
		result.message += errMsg
		return result;
	}
}

/** Register Request */
export async function Request_UserRegister( Username: string, Password: string, ComFlowManager?: ComFlowManager ): Promise<Buffer|Error>
{	
	const Headers: http.IncomingHttpHeaders =
	{
		[EHeaders.USERNAME]: Username,
		[EHeaders.PASSWORD]: Password
	};
	return ProcessRequest( { path: EMappedPaths.USER, method: 'put', clientRequestInternalOptions: { Headers, ComFlowManager } } );
}
/** Login Request */
export async function Request_UserLogin( Username: string, Password: string, ComFlowManager?: ComFlowManager ): Promise<Buffer|Error>
{
	const Headers: http.IncomingHttpHeaders =
	{
		[EHeaders.USERNAME]: Username,
		[EHeaders.PASSWORD]: Password
	};
	const result = await ProcessRequest( { path: EMappedPaths.USER, method: 'get', clientRequestInternalOptions: { Headers, ComFlowManager } } );
	if (Buffer.isBuffer(result))
	{
		await FS_Storage.AddResource( 'accessToken', result );
		await FS_Storage.SaveStorage();
	}
	return result;
}
/** Login by token request */
export async function Request_UserLoginByToken( Token: string, ComFlowManager?: ComFlowManager ): Promise<Buffer|Error>
{
	const Headers: http.IncomingHttpHeaders =
	{
		[EHeaders.TOKEN]: Token,
	};
	return ProcessRequest( { path: EMappedPaths.USER, method: 'get', clientRequestInternalOptions: { Headers, ComFlowManager } } );
}
/** Logout Request */
export async function Request_UserLogout( Token: string, ComFlowManager?: ComFlowManager ): Promise<Buffer|Error>
{
	const Headers: http.IncomingHttpHeaders =
	{
		[EHeaders.TOKEN]: Token,
	};
	await FS_Storage.RemoveResource( 'accessToken' );
	await FS_Storage.SaveStorage();
	return ProcessRequest( { path: EMappedPaths.USER, method: 'post', clientRequestInternalOptions: { Headers, ComFlowManager } } );
}

const RetrieveToken = async () => (await FS_Storage.GetResource('accessToken')).toString() 

// STORAGE
export async function Request_StorageGetData( ComFlowManager: ComFlowManager, Key: string ): Promise<Buffer|Error>
{
	const Headers: http.IncomingHttpHeaders =
	{
		[EHeaders.TOKEN]: await RetrieveToken(),
		[EHeaders.KEY]: Key
	};
	return ProcessRequest( { path: EMappedPaths.STORAGE, method: 'get', clientRequestInternalOptions: { ComFlowManager, Headers } } );
}
export async function Request_StoragePutData( ComFlowManager: ComFlowManager, Key: string, Value: any ): Promise<Buffer|Error>
{
	const Headers: http.IncomingHttpHeaders =
	{
		[EHeaders.TOKEN]: await RetrieveToken(),
		[EHeaders.KEY]: Key
	};
	return ProcessRequest( { path: EMappedPaths.STORAGE, method: 'put', clientRequestInternalOptions: { Value, ComFlowManager, Headers } } );
}


export async function Request_ResourceDownload( ComFlowManager: ComFlowManager, Identifier: string, DownloadLocation: string ): Promise<Buffer|Error>
{
	const Headers: http.IncomingHttpHeaders =
	{
		[EHeaders.TOKEN]: await RetrieveToken(),
		[EHeaders.IDENTIFIER]: Identifier,
		[EHeaders.TRANSFER_SPEED]: '50000',
	};
	return ProcessRequest( { path: EMappedPaths.RESOURCE, method: 'get', clientRequestInternalOptions: { DownloadLocation, ComFlowManager, Headers } } );
}
export async function Request_ResourceUpload( ComFlowManager: ComFlowManager, AbsoluteFilePath: string ): Promise<Buffer|Error>
{
	const Headers: http.IncomingHttpHeaders =
	{
		[EHeaders.TOKEN]: await RetrieveToken(),
		[EHeaders.IDENTIFIER]: AbsoluteFilePath,
		[EHeaders.TRANSFER_SPEED]: '50000',
	};
	return ProcessRequest( { path: EMappedPaths.RESOURCE, method: 'put', clientRequestInternalOptions: { ComFlowManager, Headers } } );
}


export async function InstallRequestsProcessor()
{
	let bResult = true;
	const bIsDev = process.env.NODE_ENV === 'development'; //TODO Remove this workaround
	CommonOptions.timeout = bIsDev ? undefined: CommonOptions.timeout;

	const serverConfigFilePath = (bIsDev ? '': '../../' ) + '../Temp/ServerCfg.json';
//	console.log(serverConfigFilePath);
	bResult = bResult && ServerConfigs.Load( serverConfigFilePath );
	if ( bResult )
	{
		CommonOptions.host = ServerConfigs.instance.PublicIPv4;
		CommonOptions.port = ServerConfigs.instance.RequestsListenerPort;
		bResult = bResult;// && WebSocketManager.Initialize();
	}
	return bResult;
}