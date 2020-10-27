/**
 * updater.js
 *
 * Please use manual update only when it is really required, otherwise please use recommended non-intrusive auto update.
 *
 * Import steps:
 * 1. create `updater.js` for the code snippet
 * 2. require `updater.js` for menu implementation, and set `checkForUpdates` callback from `updater` for the click property of `Check Updates...` MenuItem.
 */
import *  as electron from 'electron';
import * as electronUpdater from 'electron-updater';

electronUpdater.autoUpdater.autoDownload = false;

export default class AppUpdater
{
	private readonly mainWindow: electron.BrowserWindow = null;
	constructor(mainWindow: electron.BrowserWindow)
	{
		this.mainWindow = mainWindow;
	}

	public async SearchUpdates(): Promise<void>
	{
		electronUpdater.autoUpdater.on('error', (error) =>
		{
			electron.dialog.showErrorBox('Error: ', error == null ? "unknown" : (error.stack || error).toString());
			console.error(error);
			electron.app.exit(1);
		});

		const [orig_width, orig_heigth] = this.mainWindow.getSize();
		this.mainWindow.setSize(440, 130);

		// Actually check for updates
		electronUpdater.autoUpdater.checkForUpdates();

		// Set the events
		const updateAvailable = await new Promise<electronUpdater.UpdateInfo>( resolve =>
		{
			electronUpdater.autoUpdater.on('update-available', resolve );
			electronUpdater.autoUpdater.on('update-not-available', () => resolve(null) );
		});

		// Clean events for potential next checks
		electronUpdater.autoUpdater.removeAllListeners('update-available');
		electronUpdater.autoUpdater.removeAllListeners('update-not-available');

		// Declare as update only if version is different
		if ( updateAvailable && updateAvailable.version !== electron.app.getVersion() )
		{
			// Notify User
			{
				const options: electron.MessageBoxOptions =
				{
					type: 'info',
					title: 'Found Updates',
					message: 'Update required!',
				};
				await electron.dialog.showMessageBox(this.mainWindow, options);
			}
			
			// Disallow user to close window during download
			this.mainWindow.setClosable(false);

			// Setup update page data refresh event
			electronUpdater.autoUpdater.on('download-progress', ( progressObj: any) =>
			{
				this.mainWindow.webContents.send( 'update-download-progress',progressObj.percent, progressObj.bytesPerSecond );
			});

			// Actually download the update
			electronUpdater.autoUpdater.downloadUpdate();

			// Await for download completed
			await new Promise<void>( resolve =>	electronUpdater.autoUpdater.on('update-downloaded', resolve) );

			// Notify User of installation action
			{
				const options: electron.MessageBoxOptions =
				{
					title: 'Install Updates',
					message: 'Updates downloaded, application will be quit for update...'
				}
				await electron.dialog.showMessageBox(this.mainWindow, options);
			}
			
			this.mainWindow.setClosable(true);

			// As name says, quit and install update
			electronUpdater.autoUpdater.quitAndInstall();
			
		}
		else
		{
			this.mainWindow.setSize(orig_width, orig_heigth);
		//	const options: electron.MessageBoxOptions =
		//	{
		//		title: 'No Updates',
		//		message: 'Current version is up-to-date.'
		//	};
		//	electron.dialog.showMessageBox(this.mainWindow, options);
		}
	}
}




//autoUpdater.checkForUpdates();

