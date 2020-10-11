
import * as path from 'path';
import * as electron from 'electron';

import { SetupMainHandlers } from './icpMainComs';
import { InstallRequestsProcessor } from './client/client.Bridge';
import { IPackageJSON } from '../../../Common/IPackageJSON';
import FS_Storage from '../../../Common/FS_Storage';
import WebSocketManager from './client/client.Modules.WebSocket';
import GenericUtils from '../../../Common/Utils/GenericUtils';
import MainProcessProtocols from './protocols';

const bIsDev = process.env.NODE_ENV === 'development';
const { config: { name }, description, version }: IPackageJSON = require('../../package.json');

electron.app.allowRendererProcessReuse = true; // In order to avoid warning for future deprecation
electron.app.name = `${name} - ${description} v.${version}${bIsDev?' - DEVELOPMENT RUN':''}`;

console.log("BuildDevelopment", bIsDev);
const SCHEME = 'app';

//Here is where we change the default path of the cookies in order to keep them if we make automatic updates//
{
	console.log('userData', electron.app.getPath('userData'));
	const cookiePath = path.join(electron.app.getPath('userData'), 'UserData', 'Cookies');
	electron.app.setPath('userData', cookiePath);
}

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (!bIsDev)
{
	global.__static = path.join(__dirname, '/static').replace(/\\/g, /*'/'*/'\\\\');
}


process.on('beforeExit', (code: number) =>
{
	WebSocketManager.Finalize();
});



// Needs to be called before app is ready;
// gives our scheme access to load relative files,
// as well as local storage, cookies, etc.
// https://electronjs.org/docs/api/protocol#protocolregisterschemesasprivilegedcustomschemes
electron.protocol.registerSchemesAsPrivileged([
	{
		scheme: SCHEME,	privileges: { standard: true, secure: true }
	}
]);

function SetupSession()
{
	// https://electronjs.org/docs/tutorial/security#4-handle-session-permission-requests-from-remote-content
	electron.session.defaultSession.setPermissionRequestHandler( ( webContents: electron.WebContents, permission: string, callback: (permissionGranted: boolean ) => void) =>
	{
		const allowedPermissions = new Array<string>(); // Full list here: https://developer.chrome.com/extensions/declare_permissions#manifest
		if (allowedPermissions.includes(permission))
		{
			callback(true); // Approve permission request
		}
		else
		{
			console.error(`The application tried to request permission for '${ permission }'. This permission was not whitelisted and has been blocked.`);
			callback(false); // Deny
		}
	});
}

async function createMainWindow()
{
	// Create the browser window.
	const window = new electron.BrowserWindow(<Electron.BrowserWindowConstructorOptions>
	{
		// Window's height in pixels. Default is 600.
		height: 600,
		// Window's width in pixels. Default is 800.
		width: 800,
		// The width and height would be used as web page's size, which means the actual window's size will
		// include window frame's size and be slightly larger. Default is false.
		//	useContentSize: true,
		// Settings of web page's features
		webPreferences: <Electron.WebPreferences>
		{
			/** Whether node integration is enabled. Default is false. */
			nodeIntegration: false,
			nodeIntegrationInSubFrames: false,
			nodeIntegrationInWorker: false,
			nativeWindowOpen: true,
			preload: path.resolve(__static, './preload.js'),
			webSecurity: true,
			allowRunningInsecureContent: false,
			worldSafeExecuteJavaScript: true,
			enableRemoteModule: false,
			contextIsolation : true, // Cannot be set to true cause the error 'module not found'
			sandbox: true,
		},
		// Show window in the center of the screen.
		center: true,
		// Whether window should have a shadow. Default is true.
		hasShadow: false,
		// Whether window should be shown when created. Default is true.
		show: false,
	});

	await new Promise((resolve, reject) =>
	{
		// Remove the window's menu bar.
		window.removeMenu();

		// or reject if it was closed before then
		window.once('closed', () =>
		{
			reject( new Error('Window closed prematurely.') );
		});

		MainProcessProtocols.RegisterProtocols(SCHEME);

		// initiate the loading
		const winURL = bIsDev ? `http://${process.env.ELECTRON_WEBPACK_WDS_HOST}:${process.env.ELECTRON_WEBPACK_WDS_PORT}` : `file://${__dirname}/index.html`;
		window.loadURL(winURL).then(resolve).catch(( error: Error ) =>
		{
			reject(error);
		//	console.error(error);
		//	process.exit(1);
		});
	});
	
	await GenericUtils.DelayMS(1000);

	// Open the DevTools if desired
	window.webContents.openDevTools({ mode: "detach" });

	window.show();
	return Promise.resolve(window);
}

async function main()
{
	// 'ready' will be fired when Electron has finished
	// initialization and is ready to create browser windows.
	// Some APIs can only be used after this event occurs.
	await electron.app.whenReady();

	const bResult = await FS_Storage.Initialize(name, 'cookies');
	if (!bResult)
	{
		// TODO Handle this case
		return;
	}
	await FS_Storage.LoadStorage();

	// Second instance is not allowed
	const isPrimaryInstance = electron.app.requestSingleInstanceLock();
//	electron.app.on('second-instance', (event: electron.Event, argv: string[], cwd: string) =>
//	{
		if (!isPrimaryInstance)
		{
			electron.app.quit();
			return;
		}
//	});
	
	electron.app.on("browser-window-created", (event: electron.Event, window: electron.BrowserWindow) =>
	{
		InstallRequestsProcessor();
	});

	SetupSession();

	SetupMainHandlers();

	// exit when all windows are closed and this promise is resolved
	const terminationPromise = new Promise<void>((resolve: () => void) =>
	{
		electron.app.once('window-all-closed', resolve);
	});

	// we expect 'rendererReady' notification from Renderer
	const rendererPromise = new Promise<void>((resolve: () => void) =>
	{
		electron.ipcMain.once('rendererReady', resolve );
	});

	// initiate creating the main window
	const mainWindowPromise = createMainWindow();

	let InitializedCount = 0;
	mainWindowPromise.then(() => ++InitializedCount );
	rendererPromise.then(() => ++InitializedCount );

	// await both the window to have loaded 
	// and 'rendererReady' notification to have been fired,
	// while observing premature termination
	await Promise.race( [ Promise.all([rendererPromise, mainWindowPromise]), terminationPromise ] );

	if (InitializedCount === 2)
	{
		console.log('Initialization completed');
	}
	else
	{
		throw new Error('All windows closed prematurely.');
	}
	// from here we can do anything we want

	// awaiting terminationPromise here keeps the mainWindow object alive
	await terminationPromise;

	electron.app.exit(0);
}

main().catch((error: Error) =>
{
	console.error(error);
	process.exit(1);
});

