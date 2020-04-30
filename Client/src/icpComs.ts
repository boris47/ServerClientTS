

export enum EComunications
{
	/////////////////////////////////////////////////
	/////////////////  ELECTRON  ////////////////////
	/////////////////////////////////////////////////
	/** string[], any -> string | number | object */
	ELECTRON_PROPERTY = 'ELECTRON_PROPERTY',
	/** string[] -> string | number | object  */
	ELECTRON_CALL = 'ELECTRON_CALL',
	/** NONE -> string */
	USERAPPPATH = 'USERAPPPATH',

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
	/** string -> Buffer | Error */
	REQ_GET = 'REQ_GET',

	/** string, any -> Buffer | Error */
	REQ_PUT = 'REQ_PUT',

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
}
