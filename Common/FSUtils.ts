import * as fs from 'fs';



/** (Promise) Returns the size in Bytes of the given file or directory, or null in case of error
 * 
 * @param {string} filePath The path of file or directory
 * @returns {number|null} Size in Bytes or Null
 */
export async function GetFileSizeInBytesOf( filePath : string ) : Promise<number | null>
{
	const fileStatus : null | fs.Stats = await new Promise( (resolve) => {
		fs.lstat(filePath, (err, stat) =>
		{
			resolve( err ? null : stat );
		});
	});

	if ( fileStatus )
	{
		return fileStatus.size;
	}
	
	return null;
}