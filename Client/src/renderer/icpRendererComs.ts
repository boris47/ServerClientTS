

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
	[EMessageContent.ERROR]			: ( value: Error )			=> value instanceof Error 			? Object.assign(new Error(), value) : null,
	[EMessageContent.NULL]			: ( value: null )			=> value,
	[EMessageContent.UNDEFINED]		: ( value: undefined )		=> value,
}

export class ICP_RendererComs
{
	/**
	 * @param channel 
	 * @param arg0 
	 * @param args 
	 */
	public static async Invoke<T = any>(channel: EComunications, arg0?: string | string[], ...args: any | any[]): Promise<T | null>
	{
		const result: any = await Promise.resolve(ipcRenderer.invoke(channel, arg0, args));
		const typeString = Object.prototype.toString.call(result);
		const type = typeString.substring('[object '.length, typeString.lastIndexOf(']'));		
	//	console.log( channel, arg0, args, typeString, type, result )
		
		const ctor = MappedOps[type];
		if ( ctor )
		{
			return ctor(result) as T;
		}
		console.error( `RendererComs:Invoke: Unrecognized/unsupported type received at channel ${channel} with args: (${arg0}, ${args}), type is ${type}` );
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
}

