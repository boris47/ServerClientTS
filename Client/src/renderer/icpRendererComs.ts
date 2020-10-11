

//import { ipcRenderer } from 'electron';
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

/*
interface IComRendererRequest
{
	id: string;
	comFlowManager: ComFlowManager;
	callback: ( arg: any )=> any;
}
*/
export class ICP_RendererComs
{
//	private static readonly MappedRequests = new Map<string, IComRendererRequest>();

	public static Notify(channel: string, ...args: any[]): void
	{
		window.ICP_RendererInterface.notify(channel, args);
	}

	private static RegisterComFlowManagerCallbacks( channel: string, comFlowManager?: ComFlowManager ): string
	{
		if (!comFlowManager)
			console.log(`Creating new ComFlowManager fron channel ${channel}`);
		comFlowManager = comFlowManager || new ComFlowManager(channel);
		
		console.log("ICP_RendererComs:Registering ComFlowManager", comFlowManager.Tag);
		window.ICP_RendererInterface.listen(ComFlowManager.ToProgressValueId(comFlowManager.Id), (maxValue: number, currentValue: number, label: string ) =>
		{
			console.log( `ICP_RendererComs:ComFlowManager:Progress Value:[${comFlowManager.Tag}]:${maxValue}:${currentValue}` );
			comFlowManager.Progress.SetProgress( maxValue, currentValue );
			comFlowManager.Progress.SetLabel(label);
		});

		window.ICP_RendererInterface.listen(ComFlowManager.ToProgressLabelId(comFlowManager.Id), (label: string ) =>
		{
			console.log( `ICP_RendererComs:ComFlowManager:Progress Label:[${comFlowManager.Tag}]:${label}` );
			comFlowManager.Progress.SetLabel(label);
		});

		// Dispose
		window.ICP_RendererInterface.listen(ComFlowManager.ToUnregisterId(comFlowManager.Id), () =>
		{
			console.log("ICP_RendererComs:Unregistering ComFlowManager on dispose", comFlowManager.Tag);
			window.ICP_RendererInterface.stopListening( ComFlowManager.ToUnregisterId(comFlowManager.Id) );
			window.ICP_RendererInterface.stopListening( ComFlowManager.ToProgressValueId(comFlowManager.Id) );
			window.ICP_RendererInterface.stopListening( ComFlowManager.ToProgressLabelId(comFlowManager.Id) );
		});
		
		return comFlowManager.Id;
	}

	/** Allow async comunication to main process
	 * @param channel An `EComunications` channel, Ex: EComunications.ELECTRON_PATH
	 * @param comFlowManager The meanager that will handle data flow
	 * @param args Arguments to pass to the caller 
	 */
	public static async Request<T extends keyof IComunications>(channel: T, comFlowManager?: ComFlowManager, ...args: IComunications[T]['args']): Promise<IComunications[T]['return'] | null>
	{
		const registeredComFlowManagerId = ICP_RendererComs.RegisterComFlowManagerCallbacks(channel, comFlowManager);
		const result = await Promise.resolve(window.ICP_RendererInterface.request(channel, registeredComFlowManagerId, ...args));
		const typeString = Object.prototype.toString.call(result);
		const type = typeString.substring('[object '.length, typeString.length - 1);
	//	console.log( 'ICP_RendererComs:Invoke', channel, args, typeString, type, result )
		
		const ctor = MappedOps[type as EMessageContentType];
		if ( ctor )
		{
			return ctor(result);
		}
		console.error( `RendererComs:Invoke: Unrecognized/unsupported type received at channel ${channel} with args: (${args}), type is ${type}` );
		return null;
	}

}
