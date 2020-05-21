

import { ipcRenderer } from 'electron';
import { EComunications, EMessageContent } from '../icpComs';


const MappedOps : {[key:string]: Function} =
{
	[EMessageContent.BOOLEAN] 		: ( value: Boolean )		=> typeof value === 'boolean'		? Boolean(value)					: null,
	[EMessageContent.NUMBER]		: ( value: Number )			=> typeof value === 'number'		? Number(value)						: null,
	[EMessageContent.STRING]		: ( value: String )			=> typeof value === 'string'		? String(value)						: null,
	[EMessageContent.BUFFER]		: ( value: Uint8Array )		=> value && value.length > 0 		? Buffer.from(value)				: null,
	[EMessageContent.OBJECT]		: ( value: Object )			=> typeof value === 'object' 		? Object.assign({}, value)			: null,
	[EMessageContent.ARRAY]			: ( value: Array<any> )		=> Array.isArray(value)				? Array.from(value)					: null,
	[EMessageContent.ERROR]			: ( value: Error )			=> value instanceof Error 			? value								: null,
	[EMessageContent.NULL]			: ( value: null )			=> value,
	[EMessageContent.UNDEFINED]		: ( value: undefined )		=> value,
}

export class ICP_RendererComs
{
	/** Allow async comunication to main process
	 * @param channel An `EComunications` channel, Ex: EComunications.ELECTRON_PATH
	 * @param key A string or array of string containing the path to the resource required, Ex: 'exe' OR ['dialog', 'showOpenDialogSync']
	 * @param args Arguments to pass to the caller 
	 */
	public static async Invoke<T = any>(channel: EComunications, key?: string | string[], ...args: any | any[]): Promise<T | null>
	{
		const result: any = await Promise.resolve(ipcRenderer.invoke(channel, key, args));
		const typeString = Object.prototype.toString.call(result);
		const type = typeString.substring('[object '.length, typeString.lastIndexOf(']'));		
	//	console.log( channel, arg0, args, typeString, type, result )
		
		const ctor = MappedOps[type];
		if ( ctor )
		{
			return ctor(result) as T;
		}
		console.error( `RendererComs:Invoke: Unrecognized/unsupported type received at channel ${channel} with args: (${key}, ${args}), type is ${type}` );
		return null;
	}


	/**
	 * @param channel 
	 * @param args 
	 */
	public static Send(channel: string, ...args: any[]): void
	{
		ipcRenderer.send(channel, args);
	}

	public static Once(channel: string, callback: (event: Electron.IpcRendererEvent, ...args: any[]) => void)
	{
		ipcRenderer.once(channel, callback);
	}

	public static On(channel: string, callback: (event: Electron.IpcRendererEvent, ...args: any[]) => void)
	{
		ipcRenderer.on(channel, callback);
	}
}

