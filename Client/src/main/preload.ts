
import * as electron from 'electron';

electron.contextBridge.exposeInMainWorld
(
	"api",
	{
		send: ( channel: string, ...data: any ) =>
		{
			const validChannels = ["toMain"];
			if (validChannels.includes(channel))
			{
				electron.ipcRenderer.send(channel, data);
            }
		},
		
		receive: ( channel: string, callback: Function ) =>
		{
			const validChannels = ["fromMain"];
            if (validChannels.includes(channel)) {
				// Deliberately strip event as it includes `sender`
                electron.ipcRenderer.on(channel, (event, ...args) => callback(args));
            }
        }
    }
);
	
// Script loaded by the preload attribute of the browser window
//const isDevelopmentEnvironment = process.env.NODE_ENV !== "production";

// Script loaded by the preload attribute of the browser window
//const nodeRequire = require;
/*
// In development mode we need the require function to get hot reload to work
window.require = <any>((requiredModule: string) =>
{
	if(isDevelopmentEnvironment)
	{
		console.log(`Required module "${requiredModule}"`);
		switch(requiredModule)
		{
			case 'module': return nodeRequire('module');
			case "source-map-support/source-map-support.js": return nodeRequire("source-map-support/source-map-support.js");
	//		case 'vue-router': return nodeRequire('vue-router');
			case 'electron': return nodeRequire('electron');
			default: new Error(`Tried to require unknown module: ${requiredModule}`);
		}
	}
	else
	{
		// This is basically here as a reminder to not use require when being run in production mode
        throw new Error(`require(${requiredModule}) call caught in production!`)
	}
});
*/
// Make a module available
//	window.module = {
//		exports: {},
//		require: window.require,
//		id: "preload-module",
//		filename: __filename,
//		loaded: true,
//		parent: null,
//		children: [],
//		paths: []
//	};