import * as fs from 'fs';
import * as path from 'path';
import GenericUtils from './GenericUtils';


///////////////////////////////////////////
export interface IMappedFolderData
{
	files : string[];
	folders : string[];
}

export default class FSUtils
{
	/**  */
	public static GetUserDataFolder()
	{
		return process.env.APPDATA || path.join( process.env.HOME, process.platform === 'darwin' ? '/Library/Preferences' : "/.local/share" );
	}

	public static IsError( result : any ): result is NodeJS.ErrnoException
	{
		return result instanceof Error;
	}

	/**  */
	public static async Copy( absoluteSourceFolder : string, absoluteDestinationFolder : string, subfolder? : string ) : Promise<Map<string, (NodeJS.ErrnoException | null )>>
	{
		const mapped : IMappedFolderData = FSUtils.MapFolder( path.join( absoluteSourceFolder, subfolder || '' ) );
		const results = new Map<string, (NodeJS.ErrnoException | null )>();
		for( const absoluteSourceFilePath of mapped.files )
		{
			const relativeFilePath = absoluteSourceFilePath.replace( path.join( absoluteSourceFolder, subfolder || ''), '' ).replace( '\\\\', '' );
			const absoluteDestinationFilePath = path.join( absoluteDestinationFolder, relativeFilePath );
			FSUtils.EnsureDirectoryExistence( path.parse( absoluteDestinationFilePath ).dir );
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

	/**  */
	public LogIfError( result? : NodeJS.ErrnoException )
	{
		if ( GenericUtils.IsTypeOf(result, Error) )
		{
			const { name, message } = result;
			console.error( `${name}:${message}` )
		}
		return result;
	}


	/**  */
	public static FileExistsAsync( filePath : string ) : Promise<boolean>
	{
		return new Promise<boolean>( ( resolve ) =>
		{
			fs.exists( filePath, ( exists : boolean ) => resolve( exists ));
		});
	}

	
	/**  */
	public static WriteFileAsync( filePath : string, data: string | Buffer ) : Promise<NodeJS.ErrnoException | null>
	{
		return new Promise( ( resolve ) =>
		{
			fs.writeFile( filePath, Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8'), ( err: NodeJS.ErrnoException ) => resolve( err ) );
		});
	}


	/**  */
	public static ReadFileAsync( filePath : string ) : Promise<NodeJS.ErrnoException | Buffer>
	{
		return new Promise( ( resolve ) =>
		{
			fs.readFile( filePath, null, ( err: Error, data: Buffer ) => resolve( err ? err : data ) );
		});
	}


	/**  */
	public static IsDirectorySafe( directoryPath: string ): boolean
	{
		let result = false;
		try{ result = fs.lstatSync( directoryPath ).isDirectory(); } catch ( e ) {}
		return result;
	}

	
	/** Ensure that a folder exist, creating all directory tree if needed */
	public static EnsureDirectoryExistence( filePath: string ): void
	{
		const filePathNormalized: string[] = path.normalize(filePath).split(path.sep).filter( p => p );
		for (let index = 0; index < filePathNormalized.length; index++)
		{
			const pathInQuestion = filePathNormalized.slice(0, index + 1).join(path.sep);
			if ( ( !FSUtils.IsDirectorySafe( pathInQuestion ) ) )
			{
				fs.mkdirSync(pathInQuestion);
			}
		};
	}


	/**  */
	public static MapFolder( folderPath: string ): IMappedFolderData
	{
		const result : IMappedFolderData = <IMappedFolderData>
		{
			files : new Array<string>(),
			folders : new Array<string>()
		};
	
		if ( FSUtils.IsDirectorySafe( folderPath ) )
		{
			const directoriesPath = new Array<string>( path.normalize( folderPath ) );
			while( directoriesPath.length > 0 )
			{
				const dPath = directoriesPath.pop();
				fs.readdirSync( dPath ).map( fp => path.join( dPath, fp ) ).forEach( ( fp: string ) =>
				{
					if ( FSUtils.IsDirectorySafe( fp ) )
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

	
	/** If directory exists, clear all the content */
	public static DeleteFolder( folderPath: string ): void
	{
		const mapped : IMappedFolderData = FSUtils.MapFolder( folderPath );
		mapped.files.forEach( filePath => fs.unlinkSync(filePath) );
		mapped.folders.reverse().forEach( directoryPath => fs.rmdirSync(directoryPath) );
	}


	/** (Promise) Returns the size in Bytes of the given file or directory, or null in case of error */
	public static GetFileSizeInBytesOf( filePath : string ) : number | null
	{
		let result : number | null = null;
		try
		{
			result = fs.lstatSync( filePath ).size;
		}
		catch ( e ) {}
		return result;
	}
}