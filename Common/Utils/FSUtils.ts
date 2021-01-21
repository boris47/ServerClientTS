import * as fs from 'fs';
import * as path from 'path';
import GenericUtils, { Yieldable } from './GenericUtils';
import { ComProgress } from './ComUtils';


///////////////////////////////////////////
export interface IMappedFolderData
{
	files: string[];
	folders: string[];
}

export default class FSUtils
{
	/**  */
	public static GetUserDataFolder(): string
	{
		return process.env.APPDATA || path.join(process.env.HOME, process.platform === 'darwin' ? '/Library/Preferences' : "/.local/share");
	}
	
	/**  */
	public static async Copy(absoluteSourceFolder: string, absoluteDestinationFolder: string, filesToCopy?: string[]): Promise<Map<string, (NodeJS.ErrnoException | null)>>
	{
		const results = new Map<string, (NodeJS.ErrnoException | null)>();
		for (const absoluteSourceFilePath of FSUtils.MapFolder(absoluteSourceFolder).files)
		{
			if (!filesToCopy || filesToCopy.some(portion => absoluteSourceFilePath.includes(portion)))
			{
				const relativeFilePath = absoluteSourceFilePath.replace(absoluteSourceFolder, '').replace('\\\\', '');
				const absoluteDestinationFilePath = path.join(absoluteDestinationFolder, relativeFilePath);
				await FSUtils.EnsureDirectoryExistence(path.parse(absoluteDestinationFilePath).dir);
				await new Promise<void>(resolve =>
				{
					fs.copyFile(absoluteSourceFilePath, absoluteDestinationFilePath, (err: NodeJS.ErrnoException) =>
					{
						results.set(absoluteSourceFilePath, err);
						resolve();
					});
				});
			}
		}
		return results;
	}

	/**  */
	public static LogIfError(result?: NodeJS.ErrnoException)
	{
		if (GenericUtils.IsTypeOf(result, Error))
		{
			const { name, message } = result;
			console.error(`${name}:${message}`);
		}
		return result;
	}

	/**  */
	public static ExistsSync(pathToAccess: string): boolean
	{
		try
		{
			fs.accessSync(pathToAccess);
			return true;
		} catch (e) { }
		return false;
	}

	/**  */
	public static FileExistsAsync(pathToAccess: string): Promise<boolean>
	{
		return new Promise<boolean>((resolve) =>
		{
			fs.access(pathToAccess, (err: NodeJS.ErrnoException | null) => resolve(!err));
		});
	}

	/**  */
	public static async WriteFileAsync(filePath: string, data: string | Buffer, progress?: ComProgress): Promise<NodeJS.ErrnoException | null>
	{
		const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
		
		return new Promise((resolve) =>
		{
			if ( progress )
			{
				const dataSize = dataBuffer.length;
				const readStream = GenericUtils.BufferToStream(dataBuffer);
				const writeStream: fs.WriteStream = fs.createWriteStream(filePath);
				let bytesCopied: number = 0;

				readStream.on('data', function(buffer: Buffer)
				{
					bytesCopied += buffer.length;
					progress.SetProgress( dataSize, bytesCopied );
				});

				readStream.on( 'error', ( err: Error ) =>
				{
					resolve(err);
				});
				readStream.pipe(writeStream);
			}
			else
			{
				fs.writeFile(filePath, dataBuffer, (err: NodeJS.ErrnoException) => resolve(err));
			}
		});

//		return new Promise((resolve) =>
//		{
//			fs.writeFile(filePath, data, (err: NodeJS.ErrnoException) => resolve(err));
//		});
	}

	/**  */
	public static async MakeDirectoryAsync(dirPath: string): Promise<boolean>
	{
		if ((FSUtils.IsDirectorySafe(dirPath))) return true;
		return new Promise((resolve) =>
		{
			fs.mkdir(dirPath, (err: NodeJS.ErrnoException) => resolve(!err));
		});
	}

	/**  */
	public static async ReadFileAsync(filePath: string, progress?: ComProgress): Promise<NodeJS.ErrnoException | Buffer>
	{
		const statOrError = await FSUtils.ReadFileStat(filePath);
		if (GenericUtils.IsTypeOf(statOrError, Error))
		{
			return statOrError;
		}
		const dataSize: number = statOrError.size;

		return new Promise((resolve) =>
		{
			if ( progress )
			{
				const readStream: fs.ReadStream = fs.createReadStream(filePath);
				const buffers = new Array<Buffer>();
				let bytesCopied: number = 0;
				
				readStream.on('data', function(buffer: Buffer)
				{
					bytesCopied += buffer.length;
					buffers.push(buffer);
					progress.SetProgress( dataSize, bytesCopied );
				});

				readStream.on( 'error', ( err: Error ) =>
				{
					resolve(err);
				});

				readStream.on('close', () =>
				{
					resolve(Buffer.concat(buffers, bytesCopied));
				});
			}
			else
			{
				fs.readFile(filePath, null, (err: NodeJS.ErrnoException, data: Buffer) => resolve(err ? err : data));
			}
		});
	}

	/**  */
	public static ReadFileStat(filePath: string): Promise<NodeJS.ErrnoException | fs.Stats>
	{
		return new Promise((resolve) =>
		{
			fs.stat(filePath, (err: NodeJS.ErrnoException, stats: fs.Stats) => resolve(err ? err : stats));
		});
	}

	/**  */
	public static IsDirectorySafe(directoryPath: string): boolean
	{
		let result = false;
		try { result = fs.lstatSync(directoryPath).isDirectory(); } catch (e) { }
		return result;
	}


	/** Ensure that a folder exist, creating all directory tree if needed */
	public static async EnsureDirectoryExistence(filePath: string): Promise<void>
	{
		const dirNames: string[] = path.normalize(filePath).split(path.sep).filter(p => p);
		for (let index = 0; index < dirNames.length; index++)
		{
			await Yieldable(() =>
			{
				const dirPath = dirNames.slice(0, index + 1).join(path.sep);
				return FSUtils.MakeDirectoryAsync(dirPath);
			});
		};
	}

	/** Check if a file can be written at given path */
	public static EnsureWritableFile(filePath: string): Promise<boolean>
	{
		return new Promise((resolve) =>
		{
			fs.writeFile(filePath, '', (err: NodeJS.ErrnoException) => resolve(!err));
		});
	}

	/**  */
	public static MapFolder(folderPath: string): IMappedFolderData
	{
		const result: IMappedFolderData =
		{
			files: new Array<string>(),
			folders: new Array<string>()
		};

		if (FSUtils.IsDirectorySafe(folderPath))
		{
			const directoriesPath = new Array<string>(path.normalize(folderPath));
			while (directoriesPath.length > 0)
			{
				const dPath = directoriesPath.pop();
				fs.readdirSync(dPath).map((fp: string) => path.join(dPath, fp)).forEach((fp: string) =>
				{
					if (FSUtils.IsDirectorySafe(fp))
					{
						directoriesPath.push(fp);
						result.folders.push(fp);
					}
					else
					{
						result.files.push(fp);
					}
				});
			}
		}
		return result;
	}

	/** If directory exists, clear all the content */
	public static DeleteFolder(folderPath: string): void
	{
		const mapped: IMappedFolderData = FSUtils.MapFolder(folderPath);
		mapped.files.forEach(filePath => fs.unlinkSync(filePath));
		mapped.folders.reverse().forEach(directoryPath => fs.rmdirSync(directoryPath));
	}

	/** (Promise) Returns the size in Bytes of the given file or directory, or null in case of error */
	public static GetFileSizeInBytesOf(filePath: string): number | null
	{
		let result: number | null = null;
		try
		{
			result = fs.lstatSync(filePath).size;
		}
		catch (e) { }
		return result;
	}
}