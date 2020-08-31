
import * as path from 'path';
//import * as url from 'url';
import * as electron from 'electron';
import { EComunicationsChannels } from '../icpComs';

import FSUtils from '../../../Common/Utils/FSUtils';
import * as RequestProcessor from './client/client.Bridge';
import { ComFlowManager } from '../../../Common/Utils/ComUtils';
import FS_Storage from '../../../Common/FS_Storage';

const bIsDev = process.env.NODE_ENV === 'development';


const GetElectronProperty = (funcPath: string[]): any | null =>
{
	let electronField = electron as any;
	try { while (funcPath.length > 0 && electronField) electronField = electronField[funcPath.shift()]; }
	catch (ex) { console.error(ex); electronField = null; }
	return electronField || null;
};



export function SetupMainHandlers()
{
	// 
	const RegisterComFlowManager = ( sender: electron.WebContents, flowManagerId: string ) : ComFlowManager =>
	{
		const comFlowManager =  new ComFlowManager()
		{	// Progress
			const progressValueId = ComFlowManager.ToProgressValueId(flowManagerId);
			const progressLabelId = ComFlowManager.ToProgressLabelId(flowManagerId);
			let previousTruncValue = 0;
			const newValueCallback = (maxValue: number, currentValue: number) =>
			{
				const newTruncValue = ( ( currentValue / maxValue ) * 100 ) << 0;
				if ( previousTruncValue !== newTruncValue )
				{
					previousTruncValue = newTruncValue;
					sender.send( progressValueId, maxValue, currentValue, null );
				}
			};
			const newLabelCallback = (label: string) =>
			{
				sender.send( progressLabelId, comFlowManager.Progress.MaxValue, comFlowManager.Progress.CurrentValue, label );
			};
			comFlowManager.Progress.SetCallback( newValueCallback, newLabelCallback );
		}
		return comFlowManager;
	};

	//
	const DirectoryAdjustment = (resourcePath: string): string =>
	{
		return path.join( ( bIsDev ? 'static' : global.__static ), resourcePath );
	}

	/////////////////////////////////////////////////
	/////////////////  ELECTRON  ////////////////////
	/////////////////////////////////////////////////
	electron.ipcMain.handle(EComunicationsChannels.ELECTRON_MODAL_OPEN, (event: Electron.IpcMainInvokeEvent, flowManagerId: string, keys: string[], [options]: any[]): Promise<electron.OpenDialogReturnValue> =>
	{
	//	console.log( EComunicationsChannels.ELECTRON_MODAL_OPEN, options );
	//	const ComFlowManager = RegisterComFlowManager(event.sender, flowManagerId);
		const window: electron.BrowserWindow | null = electron.BrowserWindow.fromWebContents(event.sender);
		return electron.dialog.showOpenDialog(window, options);
	});

	electron.ipcMain.handle(EComunicationsChannels.ELECTRON_PROPERTY, (event: Electron.IpcMainInvokeEvent, flowManagerId: string, keys: string[]): any | null =>
	{
	//	console.log( EComunicationsChannels.ELECTRON_PROPERTY, keys );
	//	const ComFlowManager = RegisterComFlowManager(event.sender, flowManagerId);
		return GetElectronProperty(keys);
	});

	electron.ipcMain.handle(EComunicationsChannels.ELECTRON_PATH, (event: Electron.IpcMainInvokeEvent, flowManagerId: string, appToGet: string): string | Error =>
	{
	//	console.log( EComunicationsChannels.ELECTRON_PATH, appToGet );
	//	const ComFlowManager = RegisterComFlowManager(event.sender, flowManagerId);
		let result = '';
		try
		{
			// A path to a special directory or file associated with name. On failure, an Error is thrown.
			result = electron.app.getPath(appToGet as any);
		}
		catch (err)
		{
			result = err;
		}
		return result;
	});

	electron.ipcMain.handle(EComunicationsChannels.ELECTRON_CALL, (event: Electron.IpcMainInvokeEvent, flowManagerId: string, keys: string[], args: any[]): any | null =>
	{
	//	console.log( EComunicationsChannels.ELECTRON_CALL, keys, args );
	//	const ComFlowManager = RegisterComFlowManager(event.sender, flowManagerId);
		let func: (...args: any[]) => any | null;
		const result = (typeof (func = GetElectronProperty(keys)) === 'function' ? func(...args) : null);
		return result;
	});


	/////////////////////////////////////////////////
	////////////////  FILESYSTEM  ///////////////////
	/////////////////////////////////////////////////
	electron.ipcMain.handle( EComunicationsChannels.RESOURCE_PATH, ( event: Electron.IpcMainInvokeEvent, flowManagerId: string ) : string =>
	{
		return bIsDev ? 'http://127.0.0.1:9080' : process.resourcesPath;
	//		url.resolve( 'http://127.0.0.1:9080', 'resources' )
//			:
//			path.resolve( electron.app.getAppPath(), 'resources')
//		;
	});

	electron.ipcMain.handle(EComunicationsChannels.FILE_READ, (event: Electron.IpcMainInvokeEvent, flowManagerId: string, filePath: string): Promise<NodeJS.ErrnoException | Buffer> =>
	{
	//	console.log( EComunicationsChannels.READ_FILE, filePath );
		const ComFlowManager = RegisterComFlowManager(event.sender, flowManagerId);
		return FSUtils.ReadFileAsync(DirectoryAdjustment(filePath), ComFlowManager.Progress);
	});

	electron.ipcMain.handle(EComunicationsChannels.FILE_WRITE, (event: Electron.IpcMainInvokeEvent, flowManagerId: string, filePath: string, data: string | Buffer): Promise<NodeJS.ErrnoException | null> =>
	{
	//	console.log( EComunicationsChannels.WRITE_FILE, filePath, data );
		const ComFlowManager = RegisterComFlowManager(event.sender, flowManagerId);
		return FSUtils.WriteFileAsync(filePath, data, ComFlowManager.Progress);
	});

	electron.ipcMain.handle(EComunicationsChannels.STORAGE_GET, (event: Electron.IpcMainInvokeEvent, flowManagerId: string, key: string ): Promise<Buffer | null> =>
	{
		return FS_Storage.GetResource(key);
	});

	electron.ipcMain.handle(EComunicationsChannels.STORAGE_SET, (event: Electron.IpcMainInvokeEvent, flowManagerId: string, key: string, data: Buffer): Promise<boolean> =>
	{
		return FS_Storage.AddResource( key, data );
	});


	/////////////////////////////////////////////////
	/////////////////  REQUESTS  ////////////////////
	/////////////////////////////////////////////////

	electron.ipcMain.handle( EComunicationsChannels.REQ_USER_REGISTER, (event: Electron.IpcMainInvokeEvent, flowManagerId: string, username: string, password: string ): Promise<Buffer | Error> =>
	{
	//	const ComFlowManager = RegisterComFlowManager(event.sender, flowManagerId);
		return RequestProcessor.Request_UserRegister(username, password);
	});

	electron.ipcMain.handle( EComunicationsChannels.REQ_USER_LOGIN, (event: Electron.IpcMainInvokeEvent, flowManagerId: string, username: string, password: string ): Promise<Buffer | Error> =>
	{
		const ComFlowManager = RegisterComFlowManager(event.sender, flowManagerId);
		return RequestProcessor.Request_UserLogin(username, password, ComFlowManager);
	});
	
	electron.ipcMain.handle( EComunicationsChannels.REQ_USER_LOGIN_TOKEN, (event: Electron.IpcMainInvokeEvent, flowManagerId: string, token: string ): Promise<Buffer | Error> =>
	{
		const ComFlowManager = RegisterComFlowManager(event.sender, flowManagerId);
		return RequestProcessor.Request_UserLoginByToken(token, ComFlowManager);
	});
	
	electron.ipcMain.handle( EComunicationsChannels.REQ_USER_LOGOUT, (event: Electron.IpcMainInvokeEvent, flowManagerId: string, token: string): Promise<Buffer | Error> =>
	{
		const ComFlowManager = RegisterComFlowManager(event.sender, flowManagerId);
		return RequestProcessor.Request_UserLogout(token, ComFlowManager);
	});

	electron.ipcMain.handle(EComunicationsChannels.REQ_STORAGE_GET, (event: Electron.IpcMainInvokeEvent, flowManagerId: string, key: string): Promise<Buffer | Error> =>
	{
	//	console.log( EComunicationsChannels.REQ_GET, key );
		const ComFlowManager = RegisterComFlowManager(event.sender, flowManagerId);
		return RequestProcessor.Request_StorageGetData(ComFlowManager, key);
	});

	electron.ipcMain.handle(EComunicationsChannels.REQ_STORAGE_PUT, (event: Electron.IpcMainInvokeEvent, flowManagerId: string, key: string, [value]: (string | Buffer)[]): Promise<Buffer | Error> =>
	{
	//	console.log( EComunicationsChannels.REQ_PUT, key, value );
		const ComFlowManager = RegisterComFlowManager(event.sender, flowManagerId);
		return RequestProcessor.Request_StoragePutData(ComFlowManager, key, value);
	});

	electron.ipcMain.handle(EComunicationsChannels.REQ_RESOURCE_UPLOAD, (event: Electron.IpcMainInvokeEvent, flowManagerId: string, absoluteFilePath: string): Promise<Buffer | Error> =>
	{
	//	console.log( EComunicationsChannels.REQ_UPLOAD, absoluteFilePath );
		const ComFlowManager = RegisterComFlowManager(event.sender, flowManagerId);
		return RequestProcessor.Request_ResourceUpload(ComFlowManager, absoluteFilePath);
	});

	electron.ipcMain.handle(EComunicationsChannels.REQ_RESOURCE_DOWNLOAD, (event: Electron.IpcMainInvokeEvent, flowManagerId: string, identifier: string, [downloadLocation]: string[]): Promise<Buffer | Error> =>
	{
	//	console.log( EComunicationsChannels.REQ_DOWNLOAD, identifier, downloadLocation );
		const ComFlowManager = RegisterComFlowManager(event.sender, flowManagerId);
		return RequestProcessor.Request_ResourceDownload(ComFlowManager, identifier, downloadLocation);
	});
}