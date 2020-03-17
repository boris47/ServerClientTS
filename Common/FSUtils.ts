import * as fs from 'fs';
import * as path from 'path';

export interface IASyncFileReadResult
{
	bHasGoodResult : boolean;

	data : NodeJS.ErrnoException | string;
}


export const GetUserDataFolder = () => process.env.APPDATA || path.join( process.env.HOME, process.platform === 'darwin' ? '/Library/Preferences' : "/.local/share" );


export async function Copy( absoluteSourceFolder : string, absoluteDestinationFolder : string, subfolder? : string ) : Promise<Map<string, (NodeJS.ErrnoException | null )>>
{
	const absoluteFiles = new Array<string>();
	const absoluteDirs = new Array<string>( ...[path.join( absoluteSourceFolder, subfolder || '' )] );
	while ( absoluteDirs.length > 0 )
	{
		const absoluteDir = absoluteDirs.pop();
		fs.readdirSync( absoluteDir ).forEach( ( fileName : string ) =>
		{
			const fullFilePath = path.join( absoluteDir, fileName );
			( fs.statSync( fullFilePath ).isDirectory() ? absoluteDirs : absoluteFiles ).push( fullFilePath );
		});
	}

	const results = new Map<string, (NodeJS.ErrnoException | null )>();
	for( const absoluteSourceFilePath of absoluteFiles )
	{
		const relativeFilePath = absoluteSourceFilePath.replace( path.join( absoluteSourceFolder, subfolder || ''), '' ).replace( '\\\\', '' );
		const absoluteDestinationFilePath = path.join( absoluteDestinationFolder, relativeFilePath );
		const absoluteDestinationFolderPath = path.parse( absoluteDestinationFilePath ).dir;
		EnsureDirectoryExistence( absoluteDestinationFolderPath );
		await new Promise<void>( ( resolve ) =>
		{
			fs.copyFile( absoluteSourceFilePath, absoluteDestinationFilePath, ( err: NodeJS.ErrnoException ) =>
			{
				results.set( absoluteSourceFilePath, err );
				resolve();
			});
		});
	}
	return results;
}


export async function FileExistsAsync( filePath : string ) : Promise<boolean>
{
	const bResult = await new Promise<boolean>( ( resolve ) =>
	{
		fs.exists( filePath, ( exists : boolean ) =>
		{
			resolve( exists );
		});
	});
	return bResult;
}

export async function ReadFileAsync( filePath : string ) : Promise<IASyncFileReadResult>
{
	const readPromiseResult = await new Promise<IASyncFileReadResult>( ( resolve ) =>
	{
		fs.readFile( filePath, 'utf8', ( err: NodeJS.ErrnoException, data: string ) =>
		{
			const result = <IASyncFileReadResult>
			{
				bHasGoodResult : !err,
				data : err ? err : data
			}
			resolve( result );
		});
	});
	return readPromiseResult;
}


export function IsDirectory(dpath: any): boolean
{
	let result = false;
	try
	{
		result = fs.lstatSync(dpath).isDirectory();
	}
	catch ( e )
	{
		result = false;
	}
	return result;
}


/** Ensure that a folder exist, creating all directory tree if needed */
export function EnsureDirectoryExistence(filePath: string): void
{
	const filePathNormalized: string[] = path.normalize(filePath).split(path.sep);
	filePathNormalized.forEach( ( sDir : string, index : number ) =>
	{
		const pathInQuestion = filePathNormalized.slice(0, index + 1).join(path.sep);
		if ( ( IsDirectory( pathInQuestion ) === false ) && pathInQuestion )
		{
			fs.mkdirSync(pathInQuestion);
		}
	});
}

/** If directory exists, clear all the content */
export function DeleteContentFolder( folderPath: string ): void
{
	const directoryPath: string = path.normalize(folderPath);
	if ( IsDirectory( directoryPath ) )
	{
		fs.readdirSync( directoryPath ).forEach( ( fileName: string ) =>
		{
			const filePath = path.join( directoryPath, fileName );
			if ( IsDirectory( filePath ) )
			{
				DeleteContentFolder( filePath );
				fs.rmdirSync(filePath);
			}
			else
			{
				fs.unlinkSync(filePath);
			}
		});
	}
}



/** (Promise) Returns the size in Bytes of the given file or directory, or null in case of error
 * 
 * @param {string} filePath The path of file or directory
 * @returns {number|null} Size in Bytes or Null
 */
export function GetFileSizeInBytesOf( filePath : string ) : number | null
{
	if ( fs.existsSync( filePath ) )
	{
		const stat : fs.Stats = fs.lstatSync( filePath );
		return stat.size;
	}
	return null;
}