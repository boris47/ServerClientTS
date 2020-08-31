

import { ipcRenderer } from 'electron';
import { EMessageContentType, IComunications, IMessageContentReturnTypeMap } from '../icpComs';
import { ComFlowManager } from '../../../Common/Utils/ComUtils';


const MappedOps : { [key in EMessageContentType]: IMessageContentReturnTypeMap[key]; } =
{
	[EMessageContentType.BOOLEAN] 		: ( value: Boolean )		=> typeof value === 'boolean'		? value						: null,
	[EMessageContentType.NUMBER]		: ( value: Number )			=> typeof value === 'number'		? value						: null,
	[EMessageContentType.STRING]		: ( value: String )			=> typeof value === 'string'		? value						: null,
	[EMessageContentType.BUFFER]		: ( value: Uint8Array )		=> value && value.length > 0 		? Buffer.from(value)				: null,
	[EMessageContentType.OBJECT]		: ( value: Object )			=> typeof value === 'object' 		? value			: null,
	[EMessageContentType.ARRAY]			: ( value: Array<any> )		=> Array.isArray(value)			? value					: null,
	[EMessageContentType.ERROR]			: ( value: Error )			=> value instanceof Error 			? value								: null,
	[EMessageContentType.NULL]			: ( value: null )			=> value,
	[EMessageContentType.UNDEFINED]		: ( value: undefined )		=> value,
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
			ipcRenderer.on(ComFlowManager.ToProgressValueId(comFlowManager.Id), (event: Electron.IpcRendererEvent, maxValue: number, currentValue: number, label: string ) =>
			{
				comFlowManager.Progress.SetProgress( maxValue, currentValue );
				comFlowManager.Progress.SetLabel(label);
			//	console.log( `ICP_RendererComs:ComFlowManager:Progress Value:[${comFlowManager.Id}]:${maxValue}:${currentValue}` );
			});

			ipcRenderer.on(ComFlowManager.ToProgressLabelId(comFlowManager.Id), (event: Electron.IpcRendererEvent, label: string ) =>
			{
				comFlowManager.Progress.SetLabel(label);
			//	console.log( `ICP_RendererComs:ComFlowManager:Progress Label:[${comFlowManager.Id}]:${label}` );
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
			ipcRenderer.removeAllListeners( ComFlowManager.ToProgressValueId(comFlowManager.Id) );
			ipcRenderer.removeAllListeners( ComFlowManager.ToProgressLabelId(comFlowManager.Id) );
		}
	}


	/** Allow async comunication to main process
	 * @param channel An `EComunications` channel, Ex: EComunications.ELECTRON_PATH
	 * @param comFlowManager The meanager that will handle data flow
	 * @param key A string or array of string containing the path to the resource required, Ex: 'exe' OR ['dialog', 'showOpenDialogSync']
	 * @param args Arguments to pass to the caller 
	 */
	public static async Invoke<T extends keyof IComunications>(channel: T, comFlowManager: ComFlowManager, ...args: IComunications[T]['args']): Promise<IComunications[T]['return'] | null>
	{
		ICP_RendererComs.RegisterComFlowManagerCallbacks(comFlowManager);
		{
			var result = await Promise.resolve(ipcRenderer.invoke(channel, comFlowManager?.Id, ...args));
		}
		ICP_RendererComs.UnregisterComFlowManagerCallbacks(comFlowManager);
		
		const typeString = Object.prototype.toString.call(result);
		const type = typeString.substring('[object '.length, typeString.length - 1);
	//	console.log( ''ICP_RendererComs:Invoke, channel, key, args, typeString, type, result )
		
		const ctor = MappedOps[type as EMessageContentType];
		if ( ctor )
		{
			return ctor(result);
		}
		console.error( `RendererComs:Invoke: Unrecognized/unsupported type received at channel ${channel} with args: (${args}), type is ${type}` );
		return null;
	}

	
	/** Allow sync comunication to main process
	 * @param channel An `EComunications` channel, Ex: EComunications.ELECTRON_PATH
	 * @param key A string or array of string containing the path to the resource required, Ex: 'exe' OR ['dialog', 'showOpenDialogSync']
	 * @param args Arguments to pass to the caller 
	 */
//	public static InvokeSync<T extends keyof IComunications>(channel: T, key?: string | string[], ...args: any | any[] ) : IComunications[T] | null
//	{
//		const result = ipcRenderer.sendSync(channel, key, args);
//
//		const typeString = Object.prototype.toString.call(result);
//		const type = typeString.substring('[object '.length, typeString.length - 1);
//	//	console.log( 'ICP_RendererComs:InvokeSync', channel, key, args, typeString, type, result )
//		
//		const ctor = MappedOps[type];
//		if ( ctor )
//		{
//			return ctor(result);
//		}
//		console.error( `RendererComs:InvokeSync: Unrecognized/unsupported type received at channel ${channel} with args: (${key}, ${args}), type is ${type}` );
//		return null;
//	}
}

