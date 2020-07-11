

import { ipcRenderer } from 'electron';
import { EComunications, EMessageContent } from '../icpComs';
import { ComFlowManager } from '../../../Common/Utils/ComUtils';


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
};

export class ICP_RendererComs
{
	/** Add all the listeners for each flow of this manager
	 * @param comFlowManager 
	 */
	private static RegisterComFlowManagerCallbacks( comFlowManager?: ComFlowManager )
	{
		if ( comFlowManager )
		{
			ipcRenderer.on(ComFlowManager.ToProgressId(comFlowManager.Id), (event: Electron.IpcRendererEvent, maxValue: number, currentValue: number ) =>
			{
				comFlowManager.Progress.SetProgress( maxValue, currentValue );
			//	console.log( `ICP_RendererComs:ComFlowManager:Progress:[${comFlowManager.Id}]:${maxValue}:${currentValue}` );
			});
		}
	}

	/** Remove the listeners added for each flow of this manager
	 * @param comFlowManager 
	 */
	private static UnregisterComFlowManagerCallbacks( comFlowManager?: ComFlowManager )
	{
		if ( comFlowManager )
		{
			ipcRenderer.removeAllListeners( ComFlowManager.ToProgressId(comFlowManager.Id) );
		}
	}


	/** Allow async comunication to main process
	 * @param channel An `EComunications` channel, Ex: EComunications.ELECTRON_PATH
	 * @param progress The progress object to update 
	 * @param key A string or array of string containing the path to the resource required, Ex: 'exe' OR ['dialog', 'showOpenDialogSync']
	 * @param args Arguments to pass to the caller 
	 */
	public static async Invoke<T = any>(channel: EComunications, comFlowManager?: ComFlowManager, key?: string | string[], ...args: any | any[]): Promise<T | null>
	{
		ICP_RendererComs.RegisterComFlowManagerCallbacks(comFlowManager);
		const result: any = await Promise.resolve(ipcRenderer.invoke(channel, comFlowManager?.Id, key, args));
		ICP_RendererComs.UnregisterComFlowManagerCallbacks(comFlowManager);
		
		const typeString = Object.prototype.toString.call(result);
		const type = typeString.substring('[object '.length, typeString.length - 1);
		console.log( channel, key, args, typeString, type, result )
		
		const ctor = MappedOps[type];
		if ( ctor )
		{
			return ctor(result) as T;
		}
		console.error( `RendererComs:Invoke: Unrecognized/unsupported type received at channel ${channel} with args: (${key}, ${args}), type is ${type}` );
		return null;
	}
}

