
import {contextBridge, ipcRenderer, IpcRendererEvent} from 'electron';

console.log("PRELOAD");

contextBridge.exposeInMainWorld
(
	"ICP_RendererInterface",
	{	
		listen: ( channel: string, callback: Function ) => ipcRenderer.on(channel, ( event: IpcRendererEvent, ...args: any[] ) => callback(...args)),

		stopListening: ( channel: string ) => ipcRenderer.removeAllListeners(channel),

		request: async ( channel: string, comFlowManagerId: string, ...data: any[] ) => await ipcRenderer.invoke(channel, comFlowManagerId, ...data),

		notify: ( channel: string, ...data: any[] ) => ipcRenderer.send(channel, ...data)
    }
);