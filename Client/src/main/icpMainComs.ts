
import * as path from 'path';
//import * as url from 'url';
import * as electron from 'electron';
import { EComunicationsChannels, ElectronPath, IComunications } from '../icpComs';

import FSUtils from '../../../Common/Utils/FSUtils';
import * as RequestProcessor from './client/client.Bridge';
import { ComFlowManager } from '../../../Common/Utils/ComUtils';
import FS_Storage from '../../../Common/FS_Storage';
import { Using } from '../../../Common/Utils/GenericUtils';

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
	const DirectoryAdjustment = (resourcePath: string): string =>
	{
		return path.join( ( bIsDev ? 'static' : global.__static ), resourcePath );
	}

	//
	const RegisterComFlowManager = ( sender: electron.WebContents, channel: string, comFlowManagerId: string ) : ComFlowManager =>
	{
	//	console.log("Registering ComFlowManager", comFlowManagerId);
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
				sender.send( progressLabelId, comFlowManager.Progress.MaxValue, comFlowManager.Progress.CurrentValue, label );
			};
			comFlowManager.Progress.SetCallback( newValueCallback, newLabelCallback );
		}
		return comFlowManager;
	};


	const UnregisterComFlowManager = ( sender: electron.WebContents, tag: string, comFlowManagerId: string ) : void =>
	{
	//	console.log("Unregistering ComFlowManager on dispose", tag);
		sender.send(comFlowManagerId);
	}


	const MappedHandlers : { [key in EComunicationsChannels]:( event: Electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager, ...args: IComunications[key]['args'] ) => (IComunications[key]['return'] | null) | Promise<IComunications[key]['return'] | null> } = 
	{
		[EComunicationsChannels.ELECTRON_PROPERTY]: ( event: electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager, propertyPath: string[] ) =>
		{
			return GetElectronProperty(propertyPath);
		},

		[EComunicationsChannels.ELECTRON_CALL]: ( event: electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager, functionPath: string[], ...args: any[] ) =>
		{
			let func: (...args: any[]) => any | null;
			const result = (typeof (func = GetElectronProperty(functionPath)) === 'function' ? func(...args) : null);
			return result;
		},

		[EComunicationsChannels.ELECTRON_PATH]: ( event: electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager, path: ElectronPath ) =>
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

		[EComunicationsChannels.ELECTRON_MODAL_OPEN]: ( event: electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager, options: electron.OpenDialogOptions ) =>
		{
			const window: electron.BrowserWindow | null = electron.BrowserWindow.fromWebContents(event.sender);
			return electron.dialog.showOpenDialog(window, options);
		},

		[EComunicationsChannels.RESOURCE_PATH]: ( event: electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager ) => 
		{
			console.log('requested RESOURCE_PATH');
			return bIsDev ? 'http://127.0.0.1:9080' : process.resourcesPath;
	//		url.resolve( 'http://127.0.0.1:9080', 'resources' )
//			:
//			path.resolve( electron.app.getAppPath(), 'resources')
//		;
		},

		[EComunicationsChannels.FILE_READ]: ( event: electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager, filePath: string ) =>
		{
			return FSUtils.ReadFileAsync(DirectoryAdjustment(filePath), comFlowManager.Progress);
		},

		[EComunicationsChannels.FILE_WRITE]: ( event: electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager, filePath: string, data: Buffer ) =>
		{
			return FSUtils.WriteFileAsync(filePath, data, comFlowManager.Progress);
		},

		[EComunicationsChannels.STORAGE_GET]: ( event: electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager, key: string ) =>
		{
			return FS_Storage.GetResource(key);
		},

		[EComunicationsChannels.STORAGE_SET]: ( event: electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager, key: string, value: Buffer ) =>
		{
			return FS_Storage.AddResource( key, value );
		},

		[EComunicationsChannels.REQ_USER_REGISTER]: ( event: electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager, username: string, password: string ) =>
		{
			return RequestProcessor.Request_UserRegister(username, password);
		},

		[EComunicationsChannels.REQ_USER_LOGIN]: ( event: electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager, username: string, password: string ) =>
		{
			console.log('Request_UserLogin', username, password);
			return RequestProcessor.Request_UserLogin(username, password);
		},

		[EComunicationsChannels.REQ_USER_LOGIN_TOKEN]: ( event: electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager, token: string ) =>
		{
			return RequestProcessor.Request_UserLoginByToken(token);
		},

		[EComunicationsChannels.REQ_USER_LOGOUT]: ( event: electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager, token: string ) =>
		{
			return RequestProcessor.Request_UserLogout(token);
		},

		[EComunicationsChannels.REQ_STORAGE_GET]: ( event: electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager, key: string ) =>
		{
			return RequestProcessor.Request_StorageGetData(comFlowManager, key);
		},

		[EComunicationsChannels.REQ_STORAGE_PUT]: ( event: electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager, key: string, value: string | Buffer ) =>
		{
			return RequestProcessor.Request_StoragePutData(comFlowManager, key, value);
		},

		[EComunicationsChannels.REQ_RESOURCE_UPLOAD]: ( event: electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager, absoluteResourcePath: string ) =>
		{
			return RequestProcessor.Request_ResourceUpload(comFlowManager, absoluteResourcePath);
		},

		[EComunicationsChannels.REQ_RESOURCE_DOWNLOAD]: ( event: electron.IpcMainInvokeEvent, comFlowManager: ComFlowManager, identifier: string, downloadLocation: string ) =>
		{
			return RequestProcessor.Request_ResourceDownload(comFlowManager, identifier, downloadLocation);
		}
	}

	electron.ipcMain.on("toMain", async ( event: electron.IpcMainEvent, [channel, comFlowManagerId, ...args] ) =>
	{
	//	console.log('toMain received', channel, comFlowManagerId, ...args); 

		return Using( RegisterComFlowManager(event.sender, channel, comFlowManagerId), async (comFlowManager: ComFlowManager) =>
		{ 
			const callback = <Function>MappedHandlers[channel as EComunicationsChannels];
			const result = await Promise.resolve(callback(event, comFlowManager, ...args))
			UnregisterComFlowManager(event.sender, comFlowManager.Tag, comFlowManagerId);
		//	console.log("Returning to renderer", result);
			event.sender.send("fromMain", channel, comFlowManagerId, result);
		});
	});

/*
	for( const [channel, callback] of Object.entries(MappedHandlers) )
	{
		electron.ipcMain.handle( channel, async ( event: electron.IpcMainInvokeEvent, comFlowManagerId: string, ...args:any[] ) =>
		{
			return Using( RegisterComFlowManager(event.sender, channel, comFlowManagerId), async (comFlowManager: ComFlowManager) =>
			{
				const result = await Promise.resolve((<any>callback)(event, comFlowManager, ...args))
				UnregisterComFlowManager(event.sender, comFlowManager.Tag, comFlowManagerId);
				return result;
			});
		});
	}
*/
}