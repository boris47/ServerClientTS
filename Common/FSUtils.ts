import * as fs from 'fs';



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