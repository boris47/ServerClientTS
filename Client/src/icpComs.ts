

export enum EComunications
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
	/** string -> NodeJS.ErrnoException | Buffer */
	READ_FILE = 'READ_FILE',
	/** string, Buffer -> NodeJS.ErrnoException | null */
	WRITE_FILE = 'WRITE_FILE',


	/////////////////////////////////////////////////
	/////////////////  REQUESTS  ////////////////////
	/////////////////////////////////////////////////
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
