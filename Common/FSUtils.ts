import * as fs from 'fs';
import * as path from 'path';
import * as ArrayUtils from './ArrayUtils';

export interface IASyncFileOpResult
{
	bHasGoodResult : boolean;

	data : NodeJS.ErrnoException | string;
}


export const GetUserDataFolder = () => process.env.APPDATA || path.join( process.env.HOME, process.platform === 'darwin' ? '/Library/Preferences' : "/.local/share" );


/////////////////////////////////////////////////////////////////////////////////////////
export async function Copy( absoluteSourceFolder : string, absoluteDestinationFolder : string, subfolder? : string ) : Promise<Map<string, (NodeJS.ErrnoException | null )>>
{
	const mapped : IMappedFolderData = MapFolder( path.join( absoluteSourceFolder, subfolder || '' ) );
	const results = new Map<string, (NodeJS.ErrnoException | null )>();
	for( const absoluteSourceFilePath of mapped.files )
	{
		const relativeFilePath = absoluteSourceFilePath.replace( path.join( absoluteSourceFolder, subfolder || ''), '' ).replace( '\\\\', '' );
		const absoluteDestinationFilePath = path.join( absoluteDestinationFolder, relativeFilePath );
		EnsureDirectoryExistence( path.parse( absoluteDestinationFilePath ).dir );
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


/////////////////////////////////////////////////////////////////////////////////////////
export function LogIfError( result : IASyncFileOpResult )
{
	if ( !result.bHasGoodResult )
	{
		const { name, message } = <NodeJS.ErrnoException>result.data;
		console.error( `${name}:${message}` )
	}
	return result;
}


/////////////////////////////////////////////////////////////////////////////////////////
export function FileExistsAsync( filePath : string ) : Promise<boolean>
{
	return new Promise<boolean>( ( resolve ) =>
	{
		fs.exists( filePath, ( exists : boolean ) =>
		{
			resolve( exists );
		});
	});
}


/////////////////////////////////////////////////////////////////////////////////////////
export function WriteFileAsync( filePath : string, data: any ) : Promise<IASyncFileOpResult>
{
	return new Promise<IASyncFileOpResult>( ( resolve ) =>
	{
		fs.writeFile( filePath, data, ( err: NodeJS.ErrnoException ) =>
		{
			const result = <IASyncFileOpResult>
			{
				bHasGoodResult : !err,
				data : err
			}
			resolve( result );
		});
	});
}


/////////////////////////////////////////////////////////////////////////////////////////
export function ReadFileAsync( filePath : string ) : Promise<IASyncFileOpResult>
{
	return new Promise<IASyncFileOpResult>( ( resolve ) =>
	{
		fs.readFile( filePath, 'utf8', ( err: NodeJS.ErrnoException, data: string ) =>
		{
			const result = <IASyncFileOpResult>
			{
				bHasGoodResult : !err,
				data : err ? err : data
			}
			resolve( result );
		});
	});
}


/////////////////////////////////////////////////////////////////////////////////////////
export function IsDirectory( directoryPath: string ): boolean
{
	let result = false;
	try
	{
		result = fs.lstatSync( directoryPath ).isDirectory();
	}
	catch ( e ) {}
	return result;
}


/////////////////////////////////////////////////////////////////////////////////////////
/** Ensure that a folder exist, creating all directory tree if needed */
export function EnsureDirectoryExistence( filePath: string ): void
{
	const filePathNormalized: string[] = path.normalize(filePath).split(path.sep).filter( p => p );
	for (let index = 0; index < filePathNormalized.length; index++)
	{
		const pathInQuestion = filePathNormalized.slice(0, index + 1).join(path.sep);
		if ( ( !IsDirectory( pathInQuestion ) ) )
		{
			fs.mkdirSync(pathInQuestion);
		}
	};
}


///////////////////////////////////////////
export interface IMappedFolderData
{
	files : string[];
	folders : string[];
}


/////////////////////////////////////////////////////////////////////////////////////////
export function MapFolder( folderPath: string ): IMappedFolderData
{
	const result : IMappedFolderData = <IMappedFolderData>
	{
		files : new Array<string>(),
		folders : new Array<string>()
	};

	if ( IsDirectory( folderPath ) )
	{
		const directoriesPath = new Array<string>( path.normalize( folderPath ) );
		while( directoriesPath.length > 0 )
		{
			const dPath = directoriesPath.pop();
			fs.readdirSync( dPath ).map( fp => path.join( dPath, fp ) ).forEach( ( fp: string ) =>
			{
				if ( IsDirectory( fp ) )
				{
					directoriesPath.push( fp );
					result.folders.push( fp );
				}
				else
				{
					result.files.push( fp );
				}
			});
		}
	}

	return result;
}


/////////////////////////////////////////////////////////////////////////////////////////
/** If directory exists, clear all the content */
export function DeleteFolderContent( folderPath: string ): void
{
	const mapped : IMappedFolderData = MapFolder( folderPath );
	mapped.files.forEach( filePath => fs.unlinkSync(filePath) );
	mapped.folders.reverse().forEach( directoryPath => fs.rmdirSync(directoryPath) );
}


/////////////////////////////////////////////////////////////////////////////////////////
/** (Promise) Returns the size in Bytes of the given file or directory, or null in case of error
 * 
 * @param {string} filePath The path of file or directory
 * @returns {number|null} Size in Bytes or Null
 */
export function GetFileSizeInBytesOf( filePath : string ) : number | null
{
	let result : number | null = null;
	try
	{
		result = fs.lstatSync( filePath ).size;
	}
	catch ( e ) {}
	return result;
}