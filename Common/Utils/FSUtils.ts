import * as fs from 'fs';
import * as path from 'path';
import GenericUtils, { Yieldable, CustomCrypto } from './GenericUtils';


///////////////////////////////////////////
export interface IMappedFolderData
{
	files: string[];
	folders: string[];
}

interface ICommonFSOptions
{
	bJson?: boolean;
	passPhrase32Bit?: string;
	iv?: string;
}

export interface IEncodeAndWriteOptions extends ICommonFSOptions
{
}

export interface IReadAndParseOptions<T> extends ICommonFSOptions
{
	ctor?: (arg: string|object) => T;
}

export default class FSUtils
{
	/**  */
	public static GetUserDataFolder()
	{
		return process.env.APPDATA || path.join(process.env.HOME, process.platform === 'darwin' ? '/Library/Preferences' : "/.local/share");
	}

	/**  */
	public static async Copy(absoluteSourceFolder: string, absoluteDestinationFolder: string, subfolder?: string): Promise<Map<string, (NodeJS.ErrnoException | null)>>
	{
		const mapped: IMappedFolderData = FSUtils.MapFolder(path.join(absoluteSourceFolder, subfolder || ''));
		const results = new Map<string, (NodeJS.ErrnoException | null)>();
		for (const absoluteSourceFilePath of mapped.files)
		{
			const relativeFilePath = absoluteSourceFilePath.replace(path.join(absoluteSourceFolder, subfolder || ''), '').replace('\\\\', '');
			const absoluteDestinationFilePath = path.join(absoluteDestinationFolder, relativeFilePath);
			await FSUtils.EnsureDirectoryExistence(path.parse(absoluteDestinationFilePath).dir);
			await new Promise<void>((resolve) =>
			{
				fs.copyFile(absoluteSourceFilePath, absoluteDestinationFilePath, (err: NodeJS.ErrnoException) =>
				{
					results.set(absoluteSourceFilePath, err);
					resolve();
				});
			});
		}
		return results;
	}

	/**  */
	public static LogIfError(result?: NodeJS.ErrnoException)
	{
		if (GenericUtils.IsTypeOf(result, Error))
		{
			const { name, message } = result;
			console.error(`${ name }:${ message }`);
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
	public static WriteFileAsync(filePath: string, data: string | Buffer): Promise<NodeJS.ErrnoException | null>
	{
		return new Promise((resolve) =>
		{
			fs.writeFile(filePath, data, (err: NodeJS.ErrnoException) => resolve(err));
		});
	}

	/**  */
	public static async EncodeAndWrite(filePath: string, data: object | string | Buffer, options?: IEncodeAndWriteOptions) : Promise<Error | null>
	{
		if (!data)
		{
			return new Error( `FSUtils.EncodeAndWrite: Received null data` );
		}

		let result : Buffer = null;
		if ( typeof data === 'object' && !Buffer.isBuffer(data) )
		{
			let newResult = JSON.stringify(data);
			if (typeof options?.passPhrase32Bit === 'string' && typeof options?.iv === 'string')
			{
				newResult = CustomCrypto.Encrypt(newResult, options.passPhrase32Bit, options.iv);
			}
		}
		if ( Buffer.isBuffer(data) )
		{
			result = data;
		}
		if ( typeof data === 'string' )
		{
			let newResult = data;
			if (typeof options?.passPhrase32Bit === 'string' && typeof options?.iv === 'string')
			{
				newResult = CustomCrypto.Encrypt(data, options.passPhrase32Bit, options.iv)
			}
			result = Buffer.from(newResult);
		}

		return FSUtils.WriteFileAsync( filePath, result );
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
	public static ReadFileAsync(filePath: string): Promise<NodeJS.ErrnoException | Buffer>
	{
		return new Promise((resolve) =>
		{
			fs.readFile(filePath, null, (err: NodeJS.ErrnoException, data: Buffer) => resolve(err ? err : data));
		});
	}

	/** */
	public static async ReadAndParse<T extends (string|object)>(filePath: string, options?: IReadAndParseOptions<T>): Promise<T | Error>
	{
		const contentOrError: NodeJS.ErrnoException | Buffer = await FSUtils.ReadFileAsync(filePath);
		if (!Buffer.isBuffer(contentOrError))
		{
			return contentOrError; // Error
		}

		let content = contentOrError.toString();
		if (typeof options?.passPhrase32Bit === 'string' && typeof options?.iv === 'string')
		{
			content = CustomCrypto.Decrypt(content, options.passPhrase32Bit, options.iv);
		}

		let parsed: string | object = content;
		try
		{
			parsed = options?.bJson ? JSON.parse(content) : content;
		}
		catch (ex)
		{
			return new Error(`FSUtils:ReadAndParse: Cannot parse content of file "${ filePath }" as a json object`);
		}

		if (typeof options?.ctor === 'function')
		{
			return options.ctor(parsed);
		}
		return parsed as T;
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
		const result: IMappedFolderData = <IMappedFolderData>
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
				fs.readdirSync(dPath).map(fp => path.join(dPath, fp)).forEach((fp: string) =>
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