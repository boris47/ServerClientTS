import * as fs from 'fs';
import * as path from 'path';

export interface IASyncFileReadresult
{
	bHasGoodResult : boolean;

	data : NodeJS.ErrnoException | string;
}

export async function ReadFileAsync( filePath : string ) : Promise<IASyncFileReadresult>
{
	const readPromiseResult = await new Promise<IASyncFileReadresult>( ( resolve ) =>
	{
		fs.readFile( filePath, 'utf8', ( err: NodeJS.ErrnoException, data: string ) =>
		{
			const result = <IASyncFileReadresult>
			{
				bHasGoodResult : !err,
				data : err ? err : data
			}
			resolve( result );
		});
	});
	return readPromiseResult;
}


export function isDirectory(dpath: any): boolean
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
		if ( ( this.isDirectory( pathInQuestion ) === false ) && pathInQuestion )
		{
			fs.mkdirSync(pathInQuestion);
		}
	});
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