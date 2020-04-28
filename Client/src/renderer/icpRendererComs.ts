

import { ipcRenderer } from 'electron';
import { EComunications, IMessage, EMessageContent } from '../icpComs';

export class ICP_RendererComs
{
	/**
	 * @param channel 
	 * @param arg0 
	 * @param args 
	 */
	public static async Invoke<T = any>(channel: EComunications, arg0?: string | string[], args?: any | any[]): Promise<T | null>
	{
		const result: IMessage = await Promise.resolve(ipcRenderer.invoke(channel, arg0, args));
		let converted = null;

		console.log( "DETECTED TYPE", Object.prototype.toString.call(result.data) );
		
		switch( result.dataType )
		{
			case EMessageContent.UNMODIFIED:
			{
				converted = result.data;
			} break
			case EMessageContent.BOOLEAN:
			{
				converted = Boolean(result.data as Boolean);
			} break
			case EMessageContent.NUMBER:
			{
				converted = Number(result.data as Number );
			} break
			case EMessageContent.STRING:
			{
				converted = String(result.data as String);
			} break
			case EMessageContent.BUFFER:
			{
				converted = Buffer.from( result.data as Uint8Array );
			} break
			case EMessageContent.OBJECT:
			{
				converted = Object.create(result.data as Object);
			} break
			case EMessageContent.ARRAY:
			{
				converted = Array.from(result.data as any[]);
			} break
			case EMessageContent.ERROR:
			{
				const error = result.data as Error;
				converted = new Error( error.message );
				converted.name = error.name;
				converted.stack = error.stack;
			} break
			default: console.error( `RendererComs:Invoke: Unrecognized/unsupported type received at channel ${channel} with args: (${arg0}, ${args})` );
		}

		return converted as T;
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

