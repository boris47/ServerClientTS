
import {contextBridge, ipcRenderer, IpcRendererEvent} from 'electron';

contextBridge.exposeInMainWorld
(
	"ICP_RendererInterface",
	{	
		listen: ( channel: string, callback: Function ) => ipcRenderer.on(channel, ( event: IpcRendererEvent, ...args: any[] ) => callback(channel, args)),

		stopListening: ( channel: string ) => ipcRenderer.removeAllListeners(channel),

		request: ( channel: string, ...data: any[] ) => ipcRenderer.invoke(channel, ...data),

		notify: ( channel: string, ...data: any[] ) => ipcRenderer.send(channel, ...data)
    }
);
