
import * as electron from 'electron';

electron.contextBridge.exposeInMainWorld
(
	"ICP_RendererInterface",
	{	
		request: ( channel: string, ...data: any[] ) => electron.ipcRenderer.invoke(channel, ...data),

		notify: ( channel: string, ...data: any[] ) => electron.ipcRenderer.send(channel, ...data)
    }
);
