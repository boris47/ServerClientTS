
import * as electron from 'electron';

/*
class CopyCutMenu
{
	protected instance: electron.Menu = null;
	protected window: electron.BrowserWindow = null;

	//
	constructor(window: electron.BrowserWindow)
	{
		this.instance = new electron.Menu();
		this.window = window;
		const copyItem = new electron.MenuItem(
		{
			label: 'Copy',
			click: () => this.window.webContents.copy()
		});
		const pasteItem = new electron.MenuItem(
		{
			label: 'Paste',
			click: () => this.window.webContents.paste()
		});
		this.instance.append(copyItem);
		this.instance.append(pasteItem);
	}

	//
	public Show( window: electron.BrowserWindow, x: number, y: number )
	{
		this.instance.popup( { window, x, y } );
	}
}
*/

export default class ContextMenuManager
{
	protected static CopyCutMenu: electron.Menu = null;

	protected static instance: ContextMenuManager = null;
	protected window: electron.BrowserWindow = null;
	
	//
	public static Initialize( window: electron.BrowserWindow )
	{
		this.instance = new ContextMenuManager(window);

		this.CopyCutMenu = new electron.Menu();
	}
	
	//
	private constructor( window: electron.BrowserWindow )
	{
		this.window = window;
		let rightClickPosition_X: number = 0, rightClickPosition_Y: number = 0;
		const menu = new electron.Menu()
		const menuItem = new electron.MenuItem(
			{
				label: 'Inspect Element',
				click: () => this.window.webContents.inspectElement(rightClickPosition_X, rightClickPosition_Y )
			}
		);
		menu.append(menuItem)

		electron.ipcMain.on('context-menu', (event: electron.IpcMainEvent, x: number, y: number) =>
		{
			rightClickPosition_X = x;
			rightClickPosition_Y = y;
			menu.popup( { window: this.window, x, y } );
		});
	}
}
