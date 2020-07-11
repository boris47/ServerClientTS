
import * as electron from 'electron';
import { EComunications } from '../icpComs';

import FSUtils from '../../../Common/Utils/FSUtils';
import * as RequestProcessor from './client/client';
import { ComFlowManager } from '../../../Common/Utils/ComUtils';



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
		const flowManager =  new ComFlowManager()
		{	// Progress
			const progressId = ComFlowManager.ToProgressId(flowManagerId)
			let previousTruncValue = 0;
			flowManager.Progress.SetCallback( (maxValue: number, currentValue: number) =>
			{
				const newTruncValue = ( ( currentValue / maxValue ) * 100 ) << 0;
				if ( previousTruncValue !== newTruncValue )
				{
					previousTruncValue = newTruncValue;
					sender.send( progressId, maxValue, currentValue );
				}
			});
		}
		return flowManager;
	};

	/////////////////////////////////////////////////
	/////////////////  ELECTRON  ////////////////////
	/////////////////////////////////////////////////
	electron.ipcMain.handle(EComunications.ELECTRON_MODAL_OPEN, async (event: Electron.IpcMainInvokeEvent, flowManagerId: string, keys: string[], [options]: any[]): Promise<electron.OpenDialogReturnValue> =>
	{
	//	console.log( EComunications.ELECTRON_MODAL_OPEN, options );
	//	const flowManager = RegisterComFlowManager(event.sender, flowManagerId);
		const window: electron.BrowserWindow | null = electron.BrowserWindow.fromWebContents(event.sender);
		return electron.dialog.showOpenDialog(window, options);
	});

	electron.ipcMain.handle(EComunications.ELECTRON_PROPERTY, (event: Electron.IpcMainInvokeEvent, flowManagerId: string, keys: string[]): any | null =>
	{
	//	console.log( EComunications.ELECTRON_PROPERTY, keys );
	//	const flowManager = RegisterComFlowManager(event.sender, flowManagerId);
		return GetElectronProperty(keys);
	});

	electron.ipcMain.handle(EComunications.ELECTRON_PATH, (event: Electron.IpcMainInvokeEvent, flowManagerId: string, appToGet: string): string | Error =>
	{
	//	console.log( EComunications.ELECTRON_PATH, appToGet );
	//	const flowManager = RegisterComFlowManager(event.sender, flowManagerId);
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

	electron.ipcMain.handle(EComunications.ELECTRON_CALL, (event: Electron.IpcMainInvokeEvent, flowManagerId: string, keys: string[], args: any[]): any | null =>
	{
	//	console.log( EComunications.ELECTRON_CALL, keys, args );
	//	const flowManager = RegisterComFlowManager(event.sender, flowManagerId);
		let func: (...args: any[]) => any | null;
		const result = (typeof (func = GetElectronProperty(keys)) === 'function' ? func(...args) : null);
		return result;
	});


	/////////////////////////////////////////////////
	////////////////  FILESYSTEM  ///////////////////
	/////////////////////////////////////////////////
	electron.ipcMain.handle(EComunications.READ_FILE, async (event: Electron.IpcMainInvokeEvent, flowManagerId: string, filePath: string): Promise<NodeJS.ErrnoException | Buffer> =>
	{
	//	console.log( EComunications.READ_FILE, filePath );
	//	const flowManager = RegisterComFlowManager(event.sender, flowManagerId);
		return FSUtils.ReadFileAsync(filePath);
	});

	electron.ipcMain.handle(EComunications.WRITE_FILE, async (event: Electron.IpcMainInvokeEvent, flowManagerId: string, filePath: string, data: string | Buffer): Promise<NodeJS.ErrnoException | null> =>
	{
	//	console.log( EComunications.WRITE_FILE, filePath, data );
	//	const flowManager = RegisterComFlowManager(event.sender, flowManagerId);
		return FSUtils.WriteFileAsync(filePath, data);
	});


	/////////////////////////////////////////////////
	/////////////////  REQUESTS  ////////////////////
	/////////////////////////////////////////////////

	electron.ipcMain.handle(EComunications.REQ_GET, async (event: Electron.IpcMainInvokeEvent, flowManagerId: string, key: string): Promise<Buffer | Error> =>
	{
	//	console.log( EComunications.REQ_GET, key );
		const flowManager = RegisterComFlowManager(event.sender, flowManagerId);
		return RequestProcessor.RequestGetData(flowManager, key);
	});

	electron.ipcMain.handle(EComunications.REQ_PUT, async (event: Electron.IpcMainInvokeEvent, flowManagerId: string, key: string, [value]: (string | Buffer)[]): Promise<Buffer | Error> =>
	{
	//	console.log( EComunications.REQ_PUT, key, value );
		const flowManager = RegisterComFlowManager(event.sender, flowManagerId);
		return RequestProcessor.RequestPutData(flowManager, key, value);
	});

	electron.ipcMain.handle(EComunications.REQ_LIST, async (event: Electron.IpcMainInvokeEvent, flowManagerId: string): Promise<Buffer | Error> =>
	{
	//	console.log( EComunications.REQ_LIST );
		const flowManager = RegisterComFlowManager(event.sender, flowManagerId);
		return RequestProcessor.RequestStorageList(flowManager);
	});

	electron.ipcMain.handle(EComunications.REQ_UPLOAD, async (event: Electron.IpcMainInvokeEvent, flowManagerId: string, absoluteFilePath: string): Promise<Buffer | Error> =>
	{
	//	console.log( EComunications.REQ_UPLOAD, absoluteFilePath );
		const flowManager = RegisterComFlowManager(event.sender, flowManagerId);
		return RequestProcessor.RequestResourceUpload(flowManager, absoluteFilePath);
	});

	electron.ipcMain.handle(EComunications.REQ_DOWNLOAD, async (event: Electron.IpcMainInvokeEvent, flowManagerId: string, identifier: string, [downloadLocation]: string[]): Promise<Buffer | Error> =>
	{
	//	console.log( EComunications.REQ_DOWNLOAD, identifier, downloadLocation );
		const flowManager = RegisterComFlowManager(event.sender, flowManagerId);
		return RequestProcessor.RequestResourceDownload(flowManager, identifier, downloadLocation);
	});
}