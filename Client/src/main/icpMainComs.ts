

import * as electron from 'electron';
import { EComunications } from '../icpComs';

import FSUtils from '../../../Common/Utils/FSUtils';
import * as RequestProcessor from './client/client.RequestProcessor';


const GetElectronProperty = (funcPath: string[]): any | null =>
{
	let electronField = electron as any;
	try { while (funcPath.length > 0 && electronField) electronField = electronField[funcPath.shift()]; }
	catch (ex) { console.error(ex); electronField = null; }
	return electronField || null;
};

export function SetupMainHandlers()
{
	/////////////////////////////////////////////////
	/////////////////  ELECTRON  ////////////////////
	/////////////////////////////////////////////////
	electron.ipcMain.handle(EComunications.ELECTRON_PROPERTY, (event: Electron.IpcMainInvokeEvent, keys: string[]): any | null =>
	{
		console.log( EComunications.ELECTRON_PROPERTY, keys );
		return GetElectronProperty(keys);
	});
	
	electron.ipcMain.handle(EComunications.ELECTRON_PATH, (event: Electron.IpcMainInvokeEvent, appToGet: string): string | Error =>
	{
		console.log( EComunications.ELECTRON_PATH );
		let result = '';
		try
		{
			result = electron.app.getPath(appToGet as any);
		}
		catch(ex)
		{
			result = ex;
		}
		return result;
	});

	electron.ipcMain.handle(EComunications.ELECTRON_CALL, (event: Electron.IpcMainInvokeEvent, keys: string[], args: any[]): any | null =>
	{
		console.log( EComunications.ELECTRON_CALL, keys, args );
		let result: any | null = null;
		try
		{
			result = GetElectronProperty(keys)(args);
		}
		catch (ex)
		{
			console.error(ex);
		}
		return result;
	});


	/////////////////////////////////////////////////
	////////////////  FILESYSTEM  ///////////////////
	/////////////////////////////////////////////////
	electron.ipcMain.handle(EComunications.READ_FILE, async (event: Electron.IpcMainInvokeEvent, filePath: string): Promise<NodeJS.ErrnoException | Buffer> =>
	{
		console.log( EComunications.READ_FILE, filePath );
		return FSUtils.ReadFileAsync(filePath);
	});

	electron.ipcMain.handle(EComunications.WRITE_FILE, async (event: Electron.IpcMainInvokeEvent, filePath: string, data: string | Buffer): Promise<NodeJS.ErrnoException | null> =>
	{
		console.log( EComunications.WRITE_FILE, filePath, data );
		return FSUtils.WriteFileAsync(filePath, data);
	});


	/////////////////////////////////////////////////
	/////////////////  REQUESTS  ////////////////////
	/////////////////////////////////////////////////

	electron.ipcMain.handle(EComunications.REQ_GET, async (event: Electron.IpcMainInvokeEvent, key: string ): Promise<Buffer | Error> =>
	{
		console.log( EComunications.REQ_GET, key );
		return RequestProcessor.RequestGetData(key);
	});

	electron.ipcMain.handle(EComunications.REQ_PUT, async (event: Electron.IpcMainInvokeEvent, key: string, value: any ): Promise<Buffer | Error> =>
	{
		console.log( EComunications.REQ_PUT, key, value );
		return RequestProcessor.RequestPutData( key, value );
	});

	electron.ipcMain.handle(EComunications.REQ_UPLOAD, async (event: Electron.IpcMainInvokeEvent, absoluteFilePath: string ): Promise<Buffer | Error> =>
	{
		console.log( EComunications.REQ_UPLOAD, absoluteFilePath );
		return RequestProcessor.RequestFileUpload(absoluteFilePath);
	});

	electron.ipcMain.handle(EComunications.REQ_DOWNLOAD, async (event: Electron.IpcMainInvokeEvent, fileName: string, downloadLocation: string ): Promise<Buffer | Error> =>
	{
		console.log( EComunications.REQ_DOWNLOAD, fileName, downloadLocation );
		return RequestProcessor.RequestFileDownload(fileName, downloadLocation);
	});
}