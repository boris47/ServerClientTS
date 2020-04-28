

import * as electron from 'electron';
import { EComunications, IMessage, EMessageContent } from '../icpComs';

import FSUtils from '../../../Common/FSUtils';
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
	electron.ipcMain.handle(EComunications.ELECTRON_PROPERTY, (event: Electron.IpcMainInvokeEvent, keys: string[]): IMessage | null =>
	{
		console.log( EComunications.ELECTRON_CALL, keys );
		const result: any | null = GetElectronProperty(keys);
		if (result)
		{
			return { dataType: EMessageContent.UNMODIFIED, data: result };
		}
		return null;
	});
	
	electron.ipcMain.handle(EComunications.USERAPPPATH, (event: Electron.IpcMainInvokeEvent): IMessage | null =>
	{
		console.log( EComunications.USERAPPPATH );
		const result = electron?.app?.getPath('appData') || null;
		return { dataType: result ? EMessageContent.STRING : EMessageContent.UNMODIFIED, data: result };
	});

	electron.ipcMain.handle(EComunications.ELECTRON_CALL, (event: Electron.IpcMainInvokeEvent, keys: string[], args: any[]): IMessage | null =>
	{
		console.log( EComunications.ELECTRON_CALL, keys, args );
		let result: any | null = null;
		try
		{
			result = GetElectronProperty(keys)(...args);
			return { dataType: EMessageContent.UNMODIFIED, data: result };
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
	electron.ipcMain.handle(EComunications.READ_FILE, async (event: Electron.IpcMainInvokeEvent, filePath: string): Promise<IMessage> =>
	{
		console.log( EComunications.READ_FILE, filePath );
		const result: Buffer | NodeJS.ErrnoException = await FSUtils.ReadFileAsync(filePath);
		return { dataType: Buffer.isBuffer(result) ? EMessageContent.BUFFER : EMessageContent.ERROR, data: result };
	});

	electron.ipcMain.handle(EComunications.WRITE_FILE, async (event: Electron.IpcMainInvokeEvent, filePath: string, data: string | Buffer): Promise<IMessage | null> =>
	{
		console.log( EComunications.WRITE_FILE, filePath, data );
		const result: NodeJS.ErrnoException | null = await FSUtils.WriteFileAsync(filePath, data);
		return { dataType: result ? EMessageContent.ERROR : EMessageContent.UNMODIFIED, data: result };
	});


	/////////////////////////////////////////////////
	/////////////////  REQUESTS  ////////////////////
	/////////////////////////////////////////////////

	electron.ipcMain.handle(EComunications.REQ_GET, async (event: Electron.IpcMainInvokeEvent, url: string ): Promise<IMessage | null> =>
	{
		console.log( EComunications.REQ_GET, url );
		throw Error("NOT IMPLEMENTED");
	//	return null;
	});

	electron.ipcMain.handle(EComunications.REQ_PUT, async (event: Electron.IpcMainInvokeEvent, key: string, value: any ): Promise<IMessage | null> =>
	{
		console.log( EComunications.REQ_PUT, key, value );
		const answer = await RequestProcessor.RequestPutData( key, value );
		return { dataType : EMessageContent.BOOLEAN, data: answer };
	});
}