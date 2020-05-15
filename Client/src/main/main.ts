
import * as path from 'path';
//import * as fs from 'fs';

import * as electron from 'electron';
import { SetupMainHandlers } from './icpMainComs';
import { InstallRequestsProcessor } from './client/client.RequestProcessor';

//const packageText = fs.readFileSync( '' )

const { productName, description, version } = require('../../package.json');

const bIsDev = process.env.NODE_ENV === 'development';

electron.app.allowRendererProcessReuse = true; // In order to avoid warning for future deprecation
electron.app.name = `${productName} - ${description} v.${version}`

//Here is where we change the default path of the cookies in order to keep them if we make automatic updates//
{
	const cookiePath = path.join(electron.app.getPath('userData'), 'UserData', 'Cookies');
	electron.app.setPath('userData', cookiePath);
}
 
/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (!bIsDev)
{
	global.__static = path.join(__dirname, '/static').replace(/\\/g, '\\\\');
}


// Needs to be called before app is ready;
// gives our scheme access to load relative files,
// as well as local storage, cookies, etc.
// https://electronjs.org/docs/api/protocol#protocolregisterschemesasprivilegedcustomschemes
electron.protocol.registerSchemesAsPrivileged([{
	scheme: 'Client',
	privileges: {
		standard: true,
		secure: true
	}
}]);

function SetupSession()
{
	// https://electronjs.org/docs/tutorial/security#4-handle-session-permission-requests-from-remote-content
	electron.session.fromPartition( 'dafault' ).setPermissionRequestHandler( ( webContents: electron.WebContents, permission: string, callback: (permissionGranted: boolean ) => void) =>
	{
		const allowedPermissions = new Array<string>(); // Full list here: https://developer.chrome.com/extensions/declare_permissions#manifest
		if (allowedPermissions.includes(permission))
		{
			callback(true); // Approve permission request
		}
		else
		{
			console.error(`The application tried to request permission for '${permission}'. This permission was not whitelisted and has been blocked.`);
			callback(false); // Deny
		}
	});
}


async function createMainWindow()
{
	// Create the browser window.
	const window = new electron.BrowserWindow( <Electron.BrowserWindowConstructorOptions>
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
				preload: path.resolve(__dirname, './preload.js'),
				webSecurity: true,
				allowRunningInsecureContent: false,
				enableRemoteModule: false,
				contextIsolation : false, // Cannot be set to true cause the error 'module not found'
				sandbox: false,
			},
			// Show window in the center of the screen.
			center: true,
			// Whether window should have a shadow. Default is true.
			hasShadow: false,
			// Whether window should be shown when created. Default is true.
			show: false,
		}
	);

	await new Promise((resolve, reject) =>
	{
		// Remove the window's menu bar.
		window.removeMenu();

		// resolve when when 'did-finish-load' has been fired
		window.webContents.once('did-finish-load', resolve);

		// or reject if it was closed before then
		window.once('closed', () =>
		{
			reject(new Error('Window closed prematurely.'));
		});

		// initiate the loading
		const winURL = bIsDev ? `http://127.0.0.1:9080` : `file://${ __dirname }/index.html`;
		window.loadURL( winURL ).catch((error: Error) =>
		{
			console.error(error);
			process.exit(1);
		});
	} );

	// Open the DevTools if desired
	window.webContents.openDevTools({ mode: "detach" });

	window.show();
	return window;
}


async function main()
{
	// 'ready' will be fired when Electron has finished
	// initialization and is ready to create browser windows.
	// Some APIs can only be used after this event occurs.
	await new Promise(resolve => electron.app.once('ready', resolve));

	// Second instance is not allowed
	const isSecondInstance = electron.app.requestSingleInstanceLock();
	electron.app.on('second-instance', (event: electron.Event, argv: string[], cwd: string) =>
	{
		if (isSecondInstance)
		{
            electron.app.quit()
        }
	});
	
	electron.app.on("browser-window-created", (event: electron.Event, window: electron.BrowserWindow) =>
	{
		InstallRequestsProcessor();
	});


	SetupSession();

	SetupMainHandlers()

	// exit when all windows are closed and this promise is resolved
	const terminationPromise = new Promise<void>((resolve: () => void) =>
	{
		electron.app.once('window-all-closed', resolve);
	});

	// we expect 'rendererReady' notification from Renderer
	const rendererPromise = new Promise<void>((resolve: () => void) =>
	{
		electron.ipcMain.once('rendererReady', () =>
		{
			console.log("renderer is ready");
			resolve();
		});
	});

	// initiate creating the main window
	const mainWindowPromise = createMainWindow();

	// await both the window to have loaded 
	// and 'rendererReady' notification to have been fired,
	// while observing premature termination
	await Promise.race(
		[
			Promise.all([rendererPromise, mainWindowPromise]),
			terminationPromise.finally(() =>
			{
				throw new Error('All windows closed prematurely.');
			})
		]
	);

	// keep the mainWindow reference
	const mainWindow = await mainWindowPromise;

	// notify the Renderer that Main is ready
	mainWindow.webContents.send("mainReady");

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

