
import * as path from 'path';
import * as electron from 'electron';

import { SetupMainHandlers } from './icpMainComs';
import { InstallRequestsProcessor } from './client/client.Bridge';
import { IPackageJSON } from '../../../Common/IPackageJSON';
import FS_Storage from '../../../Common/FS_Storage';
import AppUpdater from './autoUpdater';

import Logger from '../../../Common/Logger';


const { config: { name }, description, version }: IPackageJSON = require('../../package.json');

const bIsDev = process.env.NODE_ENV === 'development';
console.log("BuildDevelopment", bIsDev);


class MainProcess
{
	private window: electron.BrowserWindow = null;
	
	
	private async createMainWindow()
	{
		// Create the browser window..
		{
			const webPreferences: electron.WebPreferences =
			{
				/** Whether node integration is enabled. Default is false. */
				nodeIntegration: false,
				nodeIntegrationInSubFrames: false,
				nodeIntegrationInWorker: false,
				nativeWindowOpen: true,
				preload: path.resolve( __dirname, 'preload.js'),
				webSecurity: true,
				allowRunningInsecureContent: false,
				enableRemoteModule: false,
				contextIsolation : true,
				sandbox: true
			};
			
			const options: Electron.BrowserWindowConstructorOptions =
			{
				// Window's height in pixels. Default is 600.
				height: 600,
				// Window's width in pixels. Default is 800.
				width: 800,
				// The width and height would be used as web page's size, which means the actual window's size will
				// include window frame's size and be slightly larger. Default is false.
			//	useContentSize: true,
				// Settings of web page's features
				webPreferences: webPreferences,
				// Show window in the center of the screen.
				center: true,
				// Whether window should have a shadow. Default is true.
				hasShadow: false,
				// Whether window should be shown when created. Default is true.
				show: false,
			}
			this.window = new electron.BrowserWindow(options);
		};
	
		// Remove the window's menu bar.
		this.window.removeMenu();
	
		// initiate the loading
		const winURL = bIsDev ? `http://${process.env.ELECTRON_WEBPACK_WDS_HOST}:${process.env.ELECTRON_WEBPACK_WDS_PORT}` : `file://${__dirname}/index.html`;
		const bResult: boolean = await this.window.loadURL(winURL).then(() => true).catch((err: Error) =>
		{
			console.error('ERROR during "window.loadURL":', err.message);
			return false;
		});
		
		if (bResult)
		{
			// Open the DevTools if desired
			this.window.webContents.openDevTools({ mode: "detach" });
			// Finally show the window
			this.window.show();
		}
		return bResult;
	}

	public async Run()
	{
		await Logger.Initialize(name, true, '[Main Process]');

		electron.app.allowRendererProcessReuse = true; // In order to avoid warning for future deprecation
		electron.app.name = `${name} - ${description} v.${version}${bIsDev?' - DEVELOPMENT RUN':''}`;

		// Here is where we change the default path of the cookies in order to keep them if we make automatic updates //
		{
			const userDataFolderPath = electron.app.getPath('userData');
			console.log('userData', userDataFolderPath);
			const cookiePath = path.join(userDataFolderPath, 'UserData', 'Cookies');
			electron.app.setPath('userData', cookiePath);
		}

		// 'ready' will be fired when Electron has finished
		// initialization and is ready to create browser windows.
		// Some APIs can only be used after this event occurs.
		await electron.app.whenReady();
		
		// FS storage initialization
		{
			const bResult = await FS_Storage.Initialize(name, 'cookies');
			if (!bResult)
			{
				// TODO Handle this case
				return;
			}
			await FS_Storage.LoadStorage();
		}

		// Second instance is not allowed
		if (!electron.app.requestSingleInstanceLock()) // isPrimaryInstance
		{
			electron.app.quit();
			return;
		}

		// Register all the receivers for main process
		SetupMainHandlers();

		// Exit when all windows are closed and this promise is resolved
		const terminationPromise = new Promise<false>( resolve => electron.app.once('window-all-closed', () => resolve(false)) );

		// Initiate creating the main window
		const mainWindowPromise: Promise<boolean> = this.createMainWindow();
		
		// we expect 'rendererReady' notification from Renderer
		const rendererPromise = new Promise<true>( resolve => electron.ipcMain.once('rendererReady', () => resolve(true) ) );

		// await both the window to have loaded 
		// and 'rendererReady' notification to have been fired,
		// while observing premature termination
		const bInitialized = await Promise.race( [ Promise.all([mainWindowPromise, rendererPromise]), terminationPromise ] );
		if (bInitialized)
		{
			console.log('Initialization completed');
			
			// 
			InstallRequestsProcessor();

			if (!bIsDev)
			{
				await new AppUpdater(this.window).SearchUpdates();
			}
		}

		// Awaiting terminationPromise here keeps the mainWindow object alive
		await terminationPromise;
		if (!bInitialized)
		{
			throw new Error('Errors happened in running program');
		}
		
		electron.app.exit(0);
	}
}

new MainProcess().Run().catch((error: Error) =>
{
	console.error(error);
	electron.app.exit(1);
});

