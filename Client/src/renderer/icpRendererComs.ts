

import { ipcRenderer } from 'electron';
import { EComunications, EMessageContent } from '../icpComs';


const MappedOps : {[key:string]: Function} =
{
	[EMessageContent.BOOLEAN] : ( value: any ) => Boolean(value),
	[EMessageContent.NUMBER]: ( value: any ) => Number(value),
	[EMessageContent.STRING]: ( value: any ) => String(value),
	[EMessageContent.BUFFER]: ( value: any ) => Buffer.from(value),
	[EMessageContent.OBJECT]: ( value: any ) => Object.assign({}, value),
	[EMessageContent.ARRAY]: ( value: any ) => Array.from(value),
	[EMessageContent.ERROR]: ( value: any ) => Object.assign(new Error(), value),
	[EMessageContent.NULL]: ( value: any ) => value,
}

export class ICP_RendererComs
{
	/**
	 * @param channel 
	 * @param arg0 
	 * @param args 
	 */
	public static async Invoke<T = any>(channel: EComunications, arg0?: string | string[], args?: any | any[]): Promise<T | null>
	{
		const result: any = await Promise.resolve(ipcRenderer.invoke(channel, arg0, args));
		const typeString = Object.prototype.toString.call(result);
		const type = typeString.substring('[object '.length, typeString.lastIndexOf(']'));		
	//	console.log( channel, arg0, args, typeString, type )
		
		const ctor = MappedOps[type];
		if ( ctor )
		{
			return ctor(result) as T;
		}
		console.error( `RendererComs:Invoke: Unrecognized/unsupported type received at channel ${channel} with args: (${arg0}, ${args})` );
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
}

