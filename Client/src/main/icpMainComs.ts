
import * as path from 'path';
import * as electron from 'electron';
import { EComunicationsChannels, ElectronPath, IComunications } from '../icpComs';

import FSUtils from '../../../Common/Utils/FSUtils';
import * as RequestProcessor from './client/client.Bridge';
import { ComFlowManager } from '../../../Common/Utils/ComUtils';
import FS_Storage from '../../../Common/FS_Storage';

const bIsDev = process.env.NODE_ENV === 'development';

//
const GetElectronProperty = (funcPath: string[]): any | null =>
{
	let electronField = electron as any;
	try { while (funcPath.length > 0 && electronField) electronField = electronField[funcPath.shift()]; }
	catch (ex) { console.error(ex); electronField = null; }
	return electronField || null;
};

//
const DirectoryAdjustment = ( resourcePath: string ): string => path.join( bIsDev ? '' : __dirname,	'resources', resourcePath );

//
const RegisterComFlowManager = ( sender: electron.WebContents, channel: string, comFlowManagerId: string ) : ComFlowManager =>
{
//	console.log("Registering ComFlowManager", channel);
	const comFlowManager =  new ComFlowManager(channel );// `${sender.id}_${comFlowManagerId}`);
	{	// Progress
		const progressValueId = ComFlowManager.ToProgressValueId(comFlowManagerId);
		const progressLabelId = ComFlowManager.ToProgressLabelId(comFlowManagerId);
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
			const { MaxValue, CurrentValue } = comFlowManager.Progress;
			sender.send( progressLabelId, MaxValue, CurrentValue, label );
		};
		comFlowManager.Progress.SetCallback( newValueCallback, newLabelCallback );
	}
	return comFlowManager;
};


const UnregisterComFlowManager = ( sender: electron.WebContents, tag: string, comFlowManagerId: string ) : void =>
{
//	console.log("Unregistering ComFlowManager on dispose", tag);
	sender.send(ComFlowManager.ToUnregisterId(comFlowManagerId));
}


const MappedHandlers : { [key in EComunicationsChannels]:( event: Electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager, ...args: IComunications[key]['args'] ) => (IComunications[key]['return'] | null) | Promise<IComunications[key]['return'] | null> } = 
{
	[EComunicationsChannels.ELECTRON_PROPERTY]: ( event: electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager, propertyPath: string[] ): string | number | object | null =>
	{
		return GetElectronProperty(propertyPath);
	},

	[EComunicationsChannels.ELECTRON_CALL]: ( event: electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager, functionPath: string[], ...args: any[] ): string | number | object | null =>
	{
		let func: (...args: any[]) => any | null;
		const result: string | number | object | null = (typeof (func = GetElectronProperty(functionPath)) === 'function' ? func(...args) : null);
		return result;
	},

	[EComunicationsChannels.ELECTRON_PATH]: ( event: electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager, path: ElectronPath ): string | Error =>
	{
		let result: string | Error = '';
		try
		{
			// A path to a special directory or file associated with name. On failure, an Error is thrown.
			result = electron.app.getPath(path as any);
		}
		catch (err)
		{
			result = err;
		}
		return result;
	},

	[EComunicationsChannels.ELECTRON_MODAL_OPEN]: ( event: electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager, options: electron.OpenDialogOptions ): Promise<electron.OpenDialogReturnValue> =>
	{
		const window: electron.BrowserWindow | null = electron.BrowserWindow.fromWebContents(event.sender);
		return electron.dialog.showOpenDialog(window, options);
	},

	[EComunicationsChannels.RESOURCE_PATH]: ( event: electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager ): string => 
	{
		return bIsDev ? '' : __dirname;
	},

	[EComunicationsChannels.FILE_READ]: ( event: electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager, filePath: string ): Promise<NodeJS.ErrnoException | Buffer> =>
	{
		return FSUtils.ReadFileAsync(DirectoryAdjustment(filePath), comFlowManager.Progress);
	},

	[EComunicationsChannels.FILE_WRITE]: ( event: electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager, filePath: string, data: Buffer ): Promise<NodeJS.ErrnoException | null> =>
	{
		return FSUtils.WriteFileAsync(filePath, data, comFlowManager.Progress);
	},

	[EComunicationsChannels.STORAGE_GET]: ( event: electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager, key: string ): Promise<Buffer | null> =>
	{
		return FS_Storage.GetResource(key);
	},

	[EComunicationsChannels.STORAGE_SET]: ( event: electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager, key: string, value: Buffer ): Promise<boolean> =>
	{
		return FS_Storage.AddResource( key, value );
	},

	[EComunicationsChannels.REQ_USER_REGISTER]: ( event: electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager, username: string, password: string ): Promise<Error | Buffer> =>
	{
		return RequestProcessor.Request_UserRegister(username, password);
	},

	[EComunicationsChannels.REQ_USER_LOGIN]: ( event: electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager, username: string, password: string ): Promise<Error | Buffer> =>
	{
		return RequestProcessor.Request_UserLogin(username, password);
	},

	[EComunicationsChannels.REQ_USER_LOGIN_TOKEN]: ( event: electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager, token: string ): Promise<Error | Buffer> =>
	{
		return RequestProcessor.Request_UserLoginByToken(token);
	},

	[EComunicationsChannels.REQ_USER_LOGOUT]: ( event: electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager, token: string ): Promise<Error | Buffer> =>
	{
		return RequestProcessor.Request_UserLogout(token);
	},

	[EComunicationsChannels.REQ_STORAGE_GET]: ( event: electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager, key: string ): Promise<Error | Buffer> =>
	{
		return RequestProcessor.Request_StorageGetData(comFlowManager, key);
	},

	[EComunicationsChannels.REQ_STORAGE_PUT]: ( event: electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager, key: string, value: string | Buffer ): Promise<Error | Buffer> =>
	{
		return RequestProcessor.Request_StoragePutData(comFlowManager, key, value);
	},

	[EComunicationsChannels.REQ_RESOURCE_UPLOAD]: ( event: electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager, absoluteResourcePath: string ): Promise<Error | Buffer> =>
	{
		return RequestProcessor.Request_ResourceUpload(comFlowManager, absoluteResourcePath);
	},

	[EComunicationsChannels.REQ_RESOURCE_DOWNLOAD]: ( event: electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager, identifier: string, downloadLocation: string ): Promise<Buffer | Error> =>
	{
		return RequestProcessor.Request_ResourceDownload(comFlowManager, identifier, downloadLocation);
	}
}


export function SetupMainHandlers()
{
	for( const [channel, callback] of Object.entries<((...args:any) => any | Promise<any> )>(MappedHandlers) )
	{
		electron.ipcMain.handle( channel, async ( event: electron.IpcMainInvokeEvent, comFlowManagerId: string, ...args:any[] ): Promise<any> =>
		{
			const comFlowManager: ComFlowManager = RegisterComFlowManager(event.sender, channel, comFlowManagerId)
		//	console.log('ICP_MAIN: Received',channel, comFlowManagerId);
			const result = await Promise.resolve((callback)(event, comFlowManager, ...args));
			UnregisterComFlowManager(event.sender, comFlowManager.Tag, comFlowManagerId);
			return result;
		});
	}

}