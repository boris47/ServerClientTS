
import * as electron from 'electron';

export enum EComunicationsChannels
{
	/////////////////////////////////////////////////
	/////////////////  ELECTRON  ////////////////////
	/////////////////////////////////////////////////
	/** string[], any -> string | number | object */
	ELECTRON_PROPERTY = 'ELECTRON_PROPERTY',
	/** string[] -> string | number | object  */
	ELECTRON_CALL = 'ELECTRON_CALL',
	/** 'home' | 'appData' | 'userData' | 'cache' | 'temp' | 'exe' | 'module' | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos' | 'logs' | 'pepperFlashSystemPlugin' -> string | Error */
	ELECTRON_PATH = 'ELECTRON_PATH',
	/** electron.OpenDialogOptions -> electron.OpenDialogReturnValue */
	ELECTRON_MODAL_OPEN = 'ELECTRON_MODAL_OPEN',

	/////////////////////////////////////////////////
	////////////////  FILESYSTEM  ///////////////////
	/////////////////////////////////////////////////
	/** none -> string*/
	RESOURCE_PATH = 'RESOURCE_PATH',
	/** string -> NodeJS.ErrnoException | Buffer */
	READ_FILE = 'READ_FILE',
	/** string, Buffer -> NodeJS.ErrnoException | null */
	WRITE_FILE = 'WRITE_FILE',


	/////////////////////////////////////////////////
	/////////////////  REQUESTS  ////////////////////
	/////////////////////////////////////////////////
	
	/** string, string -> Buffer | Error */ 
	REQ_REGISTER = 'REQ_REGISTER',
	/** string, string -> Buffer | Error */ 
	REQ_LOGIN = 'REQ_LOGIN',
	/** string -> Buffer | Error */ 
	REQ_LOGIN_TOKEN = 'REQ_LOGIN_TOKEN',
	/** string -> Buffer | Error */ 
	REQ_LOGOUT = 'REQ_LOGOUT',

	/** string -> Buffer | null | Error */
	REQ_GET = 'REQ_GET',
	/** string, string | Buffer -> Buffer | Error */
	REQ_PUT = 'REQ_PUT',

	/** none -> Buffer | Error */
	REQ_LIST = 'REQ_LIST',
	/** string -> Buffer | Error */
	REQ_UPLOAD = 'REQ_UPLOAD',
	/** string -> Buffer | Error */
	REQ_DOWNLOAD = 'REQ_DOWNLOAD',
}

export interface IComunications
{
	[EComunicationsChannels.ELECTRON_PROPERTY] : string | number | object;
	[EComunicationsChannels.ELECTRON_CALL] : string | number | object;
	[EComunicationsChannels.ELECTRON_PATH] : string | Error;
	[EComunicationsChannels.ELECTRON_MODAL_OPEN]: electron.OpenDialogReturnValue;

	[EComunicationsChannels.RESOURCE_PATH] : string;
	[EComunicationsChannels.READ_FILE]: NodeJS.ErrnoException | Buffer;
	[EComunicationsChannels.WRITE_FILE]: NodeJS.ErrnoException | null;

	[EComunicationsChannels.REQ_REGISTER]: Buffer | Error;
	[EComunicationsChannels.REQ_LOGIN]: Buffer | Error;	
	[EComunicationsChannels.REQ_LOGIN_TOKEN]: Buffer | Error;
	[EComunicationsChannels.REQ_LOGOUT]: Buffer | Error;
	[EComunicationsChannels.REQ_GET]: Buffer | null | Error;
	[EComunicationsChannels.REQ_PUT]: Buffer | Error;
	[EComunicationsChannels.REQ_LIST]: Buffer | Error;
	[EComunicationsChannels.REQ_UPLOAD]: Buffer | Error;
	[EComunicationsChannels.REQ_DOWNLOAD]: Buffer | Error;
}

export enum EMessageContent
{
	UNMODIFIED,
	BOOLEAN = 'Boolean',
	NUMBER = 'Number',
	STRING = 'String',
	BUFFER = 'Uint8Array',
	OBJECT = 'Object',
	ARRAY = 'Array',
	ERROR = 'Error',
	NULL = 'Null',
	UNDEFINED = 'Undefined',
}
