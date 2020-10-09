
import * as electron from 'electron';

export enum EComunicationsChannels
{
	/////////////////////////////////////////////////
	/////////////////  ELECTRON  ////////////////////
	/////////////////////////////////////////////////
	ELECTRON_PROPERTY 		= 'ELECTRON_PROPERTY',
	ELECTRON_CALL 			= 'ELECTRON_CALL',
	ELECTRON_PATH 			= 'ELECTRON_PATH',
	ELECTRON_MODAL_OPEN 	= 'ELECTRON_MODAL_OPEN',

	/////////////////////////////////////////////////
	////////////////  FILESYSTEM  ///////////////////
	/////////////////////////////////////////////////
	RESOURCE_PATH 	= 'RESOURCE_PATH',
	FILE_READ 		= 'FILE_READ',
	FILE_WRITE 		= 'FILE_WRITE',
	STORAGE_GET 	= 'STORAGE_GET',
	STORAGE_SET 	= 'STORAGE_SET',


	/////////////////////////////////////////////////
	/////////////////  REQUESTS  ////////////////////
	/////////////////////////////////////////////////
	REQ_USER_REGISTER 		= 'REQ_REGISTER',
	REQ_USER_LOGIN 			= 'REQ_USER_LOGIN',
	REQ_USER_LOGIN_TOKEN 	= 'REQ_USER_LOGIN_TOKEN',
	REQ_USER_LOGOUT 		= 'REQ_USER_LOGOUT',

	REQ_STORAGE_GET 		= 'REQ_STORAGE_GET',
	REQ_STORAGE_PUT 		= 'REQ_STORAGE_PUT',

	REQ_RESOURCE_UPLOAD 	= 'REQ_RESOURCE_UPLOAD',
	REQ_RESOURCE_DOWNLOAD 	= 'REQ_RESOURCE_DOWNLOAD',
}

type ComunicationInterfaceDefinition =
{
	[key in EComunicationsChannels]: { args: object, return: any; };
};


//	const UNNECESSARY = 'UNNECESSARY';
export type ElectronPath = 'home' | 'appData' | 'userData' | 'cache' | 'temp' | 'exe' | 'module' | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos' | 'logs' | 'pepperFlashSystemPlugin';

export interface IComunications extends ComunicationInterfaceDefinition
{
	[EComunicationsChannels.ELECTRON_PROPERTY]		: { args: [propertyPath: string[]];								return: string | number | object;			};
	[EComunicationsChannels.ELECTRON_CALL]			: { args: [functionPath: string[], ...args:any[]];				return: string | number | object; 			};
	[EComunicationsChannels.ELECTRON_PATH]			: { args: [path: ElectronPath]; 								return: string | Error; 					};
	[EComunicationsChannels.ELECTRON_MODAL_OPEN]	: {	args: [options: electron.OpenDialogOptions];				return: electron.OpenDialogReturnValue;		};
	[EComunicationsChannels.RESOURCE_PATH]			: {	args: [];													return: string; 							};
	[EComunicationsChannels.FILE_READ]				: {	args: [filePath: string];									return: NodeJS.ErrnoException | Buffer;		};
	[EComunicationsChannels.FILE_WRITE]				: {	args: [filePath: string, data: Buffer];						return: NodeJS.ErrnoException | null;		};
	[EComunicationsChannels.STORAGE_GET]			: {	args: [key: string];										return: null | Buffer;						};
	[EComunicationsChannels.STORAGE_SET]			: {	args: [key: string, value: Buffer],							return: boolean;							};
	[EComunicationsChannels.REQ_USER_REGISTER]		: {	args: [username: string, password: string],					return: Buffer | Error;						};
	[EComunicationsChannels.REQ_USER_LOGIN]			: {	args: [username: string, password: string];					return: Buffer | Error;						};
	[EComunicationsChannels.REQ_USER_LOGIN_TOKEN]	: {	args: [token: string];										return: Buffer | Error;						};
	[EComunicationsChannels.REQ_USER_LOGOUT]		: {	args: [token: string];										return: Buffer | Error;						};
	[EComunicationsChannels.REQ_STORAGE_GET]		: {	args: [key: string];										return: Buffer | null | Error;				};
	[EComunicationsChannels.REQ_STORAGE_PUT]		: {	args: [key: string, value: string | Buffer];				return: Buffer | Error;						};
	[EComunicationsChannels.REQ_RESOURCE_UPLOAD]	: {	args: [absoluteResourcePath: string];						return: Buffer | Error;						};
	[EComunicationsChannels.REQ_RESOURCE_DOWNLOAD]	: {	args: [identifier: string, downloadLocation: string];		return: Buffer | Error;						};
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