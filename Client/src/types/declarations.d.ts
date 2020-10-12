


declare const __static: string;


declare namespace NodeJS
{
	interface Global
	{
		__static: string;
		clientGlobals: object;
	}
}

declare interface Window
{
	ICP_RendererInterface:
	{
		/** @see `static\\Preload.ts` */
		listen: ( channel: string, callback: Function ) => void,

		/** @see `static\\Preload.ts` */
		stopListening: ( channel: string ) => void,

		/** @see `static\\Preload.ts` */
		request: ( channel: string, comFlowManagerId: string, ...data: any[] ) => Promise<any | null>,

		/** @see `static\\Preload.ts` */
		notify: ( channel: string, ...data: any[] ) => void
	}
}
