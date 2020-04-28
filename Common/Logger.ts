
import * as fs from 'fs';
import * as path from 'path';

import FSutils from './FSUtils';

export class Logger
{
	private static instance: Logger = null;

	private fileDescriptor: number = null;


	/////////////////////////////////////////////////////////////////////////////////////////
	public static async Initialize(programName: string, bUseNodeConsole: boolean = false): Promise<boolean>
	{
		if (!this.instance)
		{
			const logFileName = Logger.CreateLogName();
			const programFolder = path.join(FSutils.GetUserDataFolder(), programName, 'logs');
			const finalFilePath = path.join(programFolder, logFileName);
			FSutils.EnsureDirectoryExistence(programFolder);

			const fileDescriptor = await new Promise<number | null>((resolve) =>
			{
				fs.open(finalFilePath, 'w', (err: NodeJS.ErrnoException, fd: number) =>
				{
					if (err)
					{
						console.error(`Logger::Initialize: Cannot open logger file at path ${ programFolder }.\n${ err.name }:${ err.message }`);
						resolve(null);
					}
					resolve(fd);
				});
			});

			if (fileDescriptor)
			{
				this.instance = new Logger();
				this.instance.fileDescriptor = fileDescriptor;

				if (bUseNodeConsole)
				{
					const oldConsoleLog = console.log;
					console.log = function(message?: any, ...optionalParams: any[])
					{
						Logger.instance.Log(message, ...optionalParams);
						oldConsoleLog.apply(console, [message, ...optionalParams]);
					};

					const oldConsoleError = console.error;
					console.error = function(message?: any, ...optionalParams: any[])
					{
						Logger.instance.Error(message, ...optionalParams);
						oldConsoleError.apply(console, [message, ...optionalParams]);
					};
				}

				process.on('exit', (code: number) =>
				{
					this.instance.Close(code);
				});
				console.log("LOG FILE PATH", finalFilePath);
			}
			return !!fileDescriptor;
		}
		return true;
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	private static CreateLogName(): string
	{
		const date = new Date();
		//	date.toDateString()			// Wed Nov 06 2019
		//	date.toISOString()			// 2019-11-06T09:13:49.926Z
		//	date.toLocaleDateString()	// 2019-11-6
		//	date.toLocaleString()		// 2019-11-6 10:13:49
		//	date.toLocaleTimeString()	// 10:13:49
		//	date.toString()				// Wed Nov 06 2019 10:13:49 GMT+0100 (GMT+01:00)
		//	date.toTimeString()			// 10:13:49 GMT+0100 (GMT+01:00)
		//	date.toUTCString()			// Wed, 06 Nov 2019 09:13:49 GMT

		const year = date.getFullYear();
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const day = date.getDate().toString().padStart(2, '0');

		const hours = date.getHours().toString().padStart(2, '0');
		const minutes = date.getMinutes().toString().padStart(2, '0');
		const seconds = date.getSeconds().toString().padStart(2, '0');
		const milliseocnds = date.getMilliseconds().toString().padStart(3, '0');

		const dateNow = `${ year }.${ month }.${ day }-${ hours }.${ minutes }.${ seconds }.${ milliseocnds }`;
		const fileName = `${ dateNow }.log`;
		return fileName;
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public Log(...messages: any[]): void
	{
		if (!this.fileDescriptor)
		{
			console.error(`Logger need a static initialization`);
			return;
		}

		const msg = `${ messages.join(' ') }\n`;
		fs.writeSync(this.fileDescriptor, msg);
		fs.fdatasyncSync(this.fileDescriptor);
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public Error(...messages: string[]): void
	{
		if (!this.fileDescriptor)
		{
			console.error(`Logger need a static initialization`);
			return;
		}

		const msg = `${ messages.join(' ') }\n`;
		fs.writeSync(this.fileDescriptor, msg);
		fs.fdatasyncSync(this.fileDescriptor);
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public Close(code: number): void
	{
		if (!this.fileDescriptor)
		{
			console.error(`Logger need a static initialization`);
			return;
		}

		const msg = `Exit Code: ${ code }`;
		fs.writeSync(this.fileDescriptor, msg);
		fs.closeSync(this.fileDescriptor);
	}
}