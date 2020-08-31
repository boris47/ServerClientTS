
import * as electron from 'electron';

export enum EComunicationsChannels
{
	/////////////////////////////////////////////////
	/////////////////  ELECTRON  ////////////////////
	/////////////////////////////////////////////////
	ELECTRON_PROPERTY = 'ELECTRON_PROPERTY',
	ELECTRON_CALL = 'ELECTRON_CALL',
	ELECTRON_PATH = 'ELECTRON_PATH',
	ELECTRON_MODAL_OPEN = 'ELECTRON_MODAL_OPEN',

	/////////////////////////////////////////////////
	////////////////  FILESYSTEM  ///////////////////
	/////////////////////////////////////////////////
	RESOURCE_PATH = 'RESOURCE_PATH',
	FILE_READ = 'READ_FILE',
	FILE_WRITE = 'WRITE_FILE',
	STORAGE_GET = 'STORAGE_GET',
	STORAGE_SET = 'STORAGE_SET',


	/////////////////////////////////////////////////
	/////////////////  REQUESTS  ////////////////////
	/////////////////////////////////////////////////
	REQ_USER_REGISTER = 'REQ_REGISTER',
	REQ_USER_LOGIN = 'REQ_USER_LOGIN',
	REQ_USER_LOGIN_TOKEN = 'REQ_USER_LOGIN_TOKEN',
	REQ_USER_LOGOUT = 'REQ_USER_LOGOUT',

	REQ_STORAGE_GET = 'REQ_STORAGE_GET',
	REQ_STORAGE_PUT = 'REQ_STORAGE_PUT',

	REQ_RESOURCE_UPLOAD = 'REQ_RESOURCE_UPLOAD',
	REQ_RESOURCE_DOWNLOAD = 'REQ_RESOURCE_DOWNLOAD',
}

type ComunicationInterfaceDefinition =
{
	[key in EComunicationsChannels]: { args: any[], return: any; };
};


//	const UNNECESSARY = 'UNNECESSARY';
type ElectronPath = 'home' | 'appData' | 'userData' | 'cache' | 'temp' | 'exe' | 'module' | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos' | 'logs' | 'pepperFlashSystemPlugin';
export interface IComunications extends ComunicationInterfaceDefinition
{
	[EComunicationsChannels.ELECTRON_PROPERTY]: {
		args: [string[]],
		return: string | number | object;
	};
	[EComunicationsChannels.ELECTRON_CALL]: {
		args: [string[]],
		return: string | number | object;
	};
	[EComunicationsChannels.ELECTRON_PATH]: {
		args: [ElectronPath],
		return: string | Error;
	};
	[EComunicationsChannels.ELECTRON_MODAL_OPEN]: {
		args: [electron.OpenDialogOptions],
		return: electron.OpenDialogReturnValue;
	};

	[EComunicationsChannels.RESOURCE_PATH]: {
		args: [null],
		return: string;
	};
	[EComunicationsChannels.FILE_READ]: {
		args: [string],
		return: NodeJS.ErrnoException | Buffer;
	};
	[EComunicationsChannels.FILE_WRITE]: {
		args: [string, Buffer],
		return: NodeJS.ErrnoException | null;
	};
	[EComunicationsChannels.STORAGE_GET]: {
		args: [string],
		return: null | Buffer;
	};
	[EComunicationsChannels.STORAGE_SET]: {
		args: [string, Buffer],
		return: boolean;
	};

	[EComunicationsChannels.REQ_USER_REGISTER]: {
		args: [string, string],
		return: [Buffer | Error];
	};
	[EComunicationsChannels.REQ_USER_LOGIN]: {
		args: [string, string],
		return: [Buffer | Error];
	};
	[EComunicationsChannels.REQ_USER_LOGIN_TOKEN]: {
		args: [string],
		return: [Buffer | Error];
	};
	[EComunicationsChannels.REQ_USER_LOGOUT]: {
		args: [string],
		return: Buffer | Error;
	};
	[EComunicationsChannels.REQ_STORAGE_GET]: {
		args: [string],
		return: Buffer | null | Error;
	};
	[EComunicationsChannels.REQ_STORAGE_PUT]: {
		args: [string, string | Buffer],
		return: Buffer | Error;
	};
	[EComunicationsChannels.REQ_RESOURCE_UPLOAD]: {
		args: [string],
		return: Buffer | Error;
	};
	[EComunicationsChannels.REQ_RESOURCE_DOWNLOAD]: {
		args: [string, string],
		return: Buffer | Error;
	};
}

export enum EMessageContentType
{
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

type MessageContentReturnMapDefinition =
{
	[key in EComunicationsChannels]: any | null;
};


export interface IMessageContentReturnTypeMap extends MessageContentReturnMapDefinition
{
	[EMessageContentType.BOOLEAN] 		: ( value: Boolean )		=> boolean;
	[EMessageContentType.NUMBER]		: ( value: Number )			=> number;
	[EMessageContentType.STRING]		: ( value: String )			=> string;
	[EMessageContentType.BUFFER]		: ( value: Uint8Array )		=> Buffer;
	[EMessageContentType.OBJECT]		: ( value: Object )			=> Object;
	[EMessageContentType.ARRAY]			: ( value: Array<any> )		=> Array<any>;
	[EMessageContentType.ERROR]			: ( value: Error )			=> Error;
	[EMessageContentType.NULL]			: ( value: null )			=> null;
	[EMessageContentType.UNDEFINED]		: ( value: undefined )		=> undefined;
}