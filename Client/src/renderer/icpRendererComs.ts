

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

	/** Add all the listeners for each flow of this manager
	 * @param comFlowManager 
	 */
/*	private static RegisterComFlowManagerCallbacks( channel: string, comFlowManager?: ComFlowManager )
	{
		comFlowManager = comFlowManager || new ComFlowManager(channel);
	//	alert((window as any).ICP_RendererInterface);
		console.log( `RegisterComFlowManagerCallbacks: ${channel}, ${comFlowManager.Id}` );
		(window as any).ICP_RendererInterface.receive( ( channel: string, data: any ) =>
		{
			console.log("RENDERER LISTEN", channel, data);
			switch(channel)
			{
				case ComFlowManager.ToProgressValueId(comFlowManager.Id):
				{
					const [maxValue, currentValue, label] = data;
					comFlowManager.Progress.SetProgress( maxValue, currentValue );
					comFlowManager.Progress.SetLabel(label);
					break;
				}
				case ComFlowManager.ToProgressLabelId(comFlowManager.Id):
				{
					const [label] = data;
					comFlowManager.Progress.SetLabel(label);
					break;
				}
				case ComFlowManager.ToUnregisterId(comFlowManager.Id):
				{
					ICP_RendererComs.MappedRequests.delete(comFlowManager.Id);
					console.log('Deleted com flow manager', comFlowManager.Tag);
					break;
				}
			}
		});
		return comFlowManager.Id;
	}
*/
	/** Allow async comunication to main process
	 * @param channel An `EComunications` channel, Ex: EComunications.ELECTRON_PATH
	 * @param comFlowManager The meanager that will handle data flow
	 * @param args Arguments to pass to the caller 
	 */
/*	public static async Request<T extends keyof IComunications>(channel: T, comFlowManager?: ComFlowManager, ...args: IComunications[T]['args']): Promise<IComunications[T]['return'] | null>
	{
		const registeredComFlowManagerId = ICP_RendererComs.RegisterComFlowManagerCallbacks(channel, comFlowManager);

		const result = await Promise.resolve((window as any).ICP_RendererInterface.send(channel, registeredComFlowManagerId, ...args));
		
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
*/

	public static Notify(channel: string, ...args: any[]): void
	{
		(window as any).ICP_RendererInterface.notify(channel, args);
	}

	public static async Request<T extends keyof IComunications>(channel: T, comFlowManager?: ComFlowManager, ...args: IComunications[T]['args']): Promise<IComunications[T]['return'] | null>
	{
		comFlowManager = comFlowManager || new ComFlowManager(channel);
	//	ICP_RendererComs.RegisterComFlowManagerCallbacks(channel, comFlowManager);
	
		const result = await Promise.resolve((window as any).ICP_RendererInterface.request(channel, comFlowManager.Id, ...args)).catch( () =>
		{
			console.log('FAILED MF');
			return null;
		});
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

/*
	private static UpdateComFlowManager( id:string, comFlowManager: ComFlowManager, data:any ): void
	{
		switch(id)
		{
			case ComFlowManager.ToProgressValueId(comFlowManager.Id):
			{
				const [maxValue, currentValue, label] = data;
				comFlowManager.Progress.SetProgress( maxValue, currentValue );
				comFlowManager.Progress.SetLabel(label);
				break;
			}
			case ComFlowManager.ToProgressLabelId(comFlowManager.Id):
			{
				const [label] = data;
				comFlowManager.Progress.SetLabel(label);
				break;
			}
			case comFlowManager.Id:
			{
				ICP_RendererComs.MappedRequests.delete(comFlowManager.Id);
				console.log('Deleted com flow manager', comFlowManager.Tag);
				break;
			}
		}
	}
*/

}
