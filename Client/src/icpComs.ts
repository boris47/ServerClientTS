

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
	/** string -> Buffer | NodeJS.ErrnoException */
	READ_FILE = 'READ_FILE',
	/** string, Buffer -> NodeJS.ErrnoException | null */
	WRITE_FILE = 'WRITE_FILE',


	/////////////////////////////////////////////////
	/////////////////  REQUESTS  ////////////////////
	/////////////////////////////////////////////////
	/** string -> any */
	REQ_GET = 'REQ_GET',

	/** string, any -> boolean */
	REQ_PUT = 'REQ_PUT',
}

export enum EMessageContent
{
	UNMODIFIED,
	BOOLEAN,
	NUMBER,
	STRING,
	BUFFER,
	OBJECT,
	ARRAY,
	ERROR,
}

export interface IMessage
{
	dataType: EMessageContent,
	data: string | boolean | number | Buffer | Error | Object | Array<any>;
}

