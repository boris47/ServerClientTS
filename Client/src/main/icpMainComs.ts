
import * as electron from 'electron';
import { EComunications } from '../icpComs';

import FSUtils from '../../../Common/Utils/FSUtils';
import * as RequestProcessor from './client/client';
import { IComProgress, ComProgress } from '../../../Common/Utils/ComUtils';



const GetElectronProperty = (funcPath: string[]): any | null =>
{
	let electronField = electron as any;
	try { while (funcPath.length > 0 && electronField) electronField = electronField[funcPath.shift()]; }
	catch (ex) { console.error(ex); electronField = null; }
	return electronField || null;
};



export function SetupMainHandlers()
{
	const RegisterProgressHandler = ( sender: electron.WebContents, progress: IComProgress ) : ComProgress =>
	{
		let previousFloorValue = 0;
		return new ComProgress( progress, (value: number) =>
		{
			const newFloorValue = Math.floor( value * 100 );
			if ( previousFloorValue !== newFloorValue )
			{
				previousFloorValue = newFloorValue;
				sender.send( progress.id, value )
			}
		});
	};

	/////////////////////////////////////////////////
	/////////////////  ELECTRON  ////////////////////
	/////////////////////////////////////////////////
	electron.ipcMain.handle(EComunications.ELECTRON_MODAL_OPEN, async (event: Electron.IpcMainInvokeEvent, progressInterface: IComProgress, keys: string[], [options]: any[]): Promise<electron.OpenDialogReturnValue> =>
	{
	//	console.log( EComunications.ELECTRON_MODAL_OPEN, options );
	//	const progress = RegisterProgressHandler(event.sender, progressInterface);
		const window: electron.BrowserWindow | null = electron.BrowserWindow.fromWebContents(event.sender);
		return electron.dialog.showOpenDialog(window, options);
	});

	electron.ipcMain.handle(EComunications.ELECTRON_PROPERTY, (event: Electron.IpcMainInvokeEvent, progressInterface: IComProgress, keys: string[]): any | null =>
	{
	//	console.log( EComunications.ELECTRON_PROPERTY, keys );
	//	const progress = RegisterProgressHandler(event.sender, progressInterface);
		return GetElectronProperty(keys);
	});

	electron.ipcMain.handle(EComunications.ELECTRON_PATH, (event: Electron.IpcMainInvokeEvent, progressInterface: IComProgress, appToGet: string): string | Error =>
	{
	//	console.log( EComunications.ELECTRON_PATH, appToGet );
	//	const progress = RegisterProgressHandler(event.sender, progressInterface);
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

	electron.ipcMain.handle(EComunications.ELECTRON_CALL, (event: Electron.IpcMainInvokeEvent, progressInterface: IComProgress, keys: string[], args: any[]): any | null =>
	{
	//	console.log( EComunications.ELECTRON_CALL, keys, args );
	//	const progress = RegisterProgressHandler(event.sender, progressInterface);
		let func: (...args: any[]) => any | null;
		const result = (typeof (func = GetElectronProperty(keys)) === 'function' ? func(...args) : null);
		return result;
	});


	/////////////////////////////////////////////////
	////////////////  FILESYSTEM  ///////////////////
	/////////////////////////////////////////////////
	electron.ipcMain.handle(EComunications.READ_FILE, async (event: Electron.IpcMainInvokeEvent, progressInterface: IComProgress, filePath: string): Promise<NodeJS.ErrnoException | Buffer> =>
	{
	//	console.log( EComunications.READ_FILE, filePath );
	//	const progress = RegisterProgressHandler(event.sender, progressInterface);
		return FSUtils.ReadFileAsync(filePath);
	});

	electron.ipcMain.handle(EComunications.WRITE_FILE, async (event: Electron.IpcMainInvokeEvent, progressInterface: IComProgress, filePath: string, data: string | Buffer): Promise<NodeJS.ErrnoException | null> =>
	{
	//	console.log( EComunications.WRITE_FILE, filePath, data );
	//	const progress = RegisterProgressHandler(event.sender, progressInterface);
		return FSUtils.WriteFileAsync(filePath, data);
	});


	/////////////////////////////////////////////////
	/////////////////  REQUESTS  ////////////////////
	/////////////////////////////////////////////////

	electron.ipcMain.handle(EComunications.REQ_GET, async (event: Electron.IpcMainInvokeEvent, progressInterface: IComProgress, key: string): Promise<Buffer | Error> =>
	{
	//	console.log( EComunications.REQ_GET, key );
		const progress = RegisterProgressHandler(event.sender, progressInterface);
		return RequestProcessor.RequestGetData(key, progress);
	});

	electron.ipcMain.handle(EComunications.REQ_PUT, async (event: Electron.IpcMainInvokeEvent, progressInterface: IComProgress, key: string, [value]: (string | Buffer)[]): Promise<Buffer | Error> =>
	{
	//	console.log( EComunications.REQ_PUT, key, value );
		const progress = RegisterProgressHandler(event.sender, progressInterface);
		return RequestProcessor.RequestPutData(key, value, progress);
	});

	electron.ipcMain.handle(EComunications.REQ_LIST, async (event: Electron.IpcMainInvokeEvent, progressInterface: IComProgress): Promise<Buffer | Error> =>
	{
	//	console.log( EComunications.REQ_LIST );
		const progress = RegisterProgressHandler(event.sender, progressInterface);
		return RequestProcessor.RequestStorageList(progress);
	});

	electron.ipcMain.handle(EComunications.REQ_UPLOAD, async (event: Electron.IpcMainInvokeEvent, progressInterface: IComProgress, absoluteFilePath: string): Promise<Buffer | Error> =>
	{
	//	console.log( EComunications.REQ_UPLOAD, absoluteFilePath );
		const progress = RegisterProgressHandler(event.sender, progressInterface);
		return RequestProcessor.RequestResourceUpload(absoluteFilePath, progress);
	});

	electron.ipcMain.handle(EComunications.REQ_DOWNLOAD, async (event: Electron.IpcMainInvokeEvent, progressInterface: IComProgress, identifier: string, [downloadLocation]: string[]): Promise<Buffer | Error> =>
	{
	//	console.log( EComunications.REQ_DOWNLOAD, identifier, downloadLocation );
		const progress = RegisterProgressHandler(event.sender, progressInterface);
		return RequestProcessor.RequestResourceDownload(identifier, downloadLocation, progress);
	});
}