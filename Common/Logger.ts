
import * as fs from 'fs';
import * as path from 'path';

import * as FSutils from './FSUtils';

export class Logger
{
	public static readonly instance : Logger = null;
	
	private fileDescriptor = null;


	/////////////////////////////////////////////////////////////////////////////////////////
	public static async Initialize( programName : string ) : Promise<boolean>
	{
		if ( !this.instance )
		{
			const logFileName = Logger.CreateLogName();
			const userDataFolder = process.env.APPDATA || ( process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share" );
			const programFolder = path.join( userDataFolder, programName , 'logs');
			const finalFilePath = path.join( programFolder, logFileName );
			FSutils.EnsureDirectoryExistence( programFolder );
			
			const fileDescriptor =  await new Promise<number | null>( ( resolve ) =>
			{
				fs.open( finalFilePath, 'w', ( err: NodeJS.ErrnoException, fd: number ) =>
				{
					if ( err )
					{
						console.error( `Logger::Initialize: Cannot open logger file at path ${programFolder}.\n${err.name}:${err.message}` );
						resolve( null );
					}
					resolve( fd );
				});
			});

			if ( fileDescriptor )
			{
				this.instance.fileDescriptor = fileDescriptor;

				( this.instance as Logger ) = new Logger();
				const oldConsoleLog = console.log;
				console.log = function()
				{
					Logger.instance.Log( arguments );
					oldConsoleLog.apply( this, arguments );
				}
	
				const oldConsoleError = console.error;
				console.error = function()
				{
					Logger.instance.Error( arguments );
					oldConsoleError.apply( this, arguments );
				}
	
				process.on( 'exit', ( code: number ) =>
				{
					this.instance.Close();
				});
				console.log( "LOG FILE PATH", finalFilePath );
				return true;
			}
		}
		return false;
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	private static CreateLogName() : string
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
	
		const dateNow = `${year}.${month}.${day}-${hours}.${minutes}.${seconds}.${milliseocnds}`;
		const fileName = `${dateNow}.log`;
		return fileName;
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public Log( messages : IArguments ) : void
	{
		if ( !Logger.instance )
		{
			console.error( `Logger need a static initialization` )
			return;
		}

		const msg = `${Array.from( messages ).join(' ')}\n`;
		fs.writeSync( this.fileDescriptor, msg );
		fs.fdatasyncSync( this.fileDescriptor );
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public Error( messages : IArguments ) : void
	{
		if ( !Logger.instance )
		{
			console.error( `Logger need a static initialization` )
			return;
		}

		const msg = `${Array.from( messages ).join(' ')}\n`;
		fs.writeSync( this.fileDescriptor, msg );
		fs.fdatasyncSync( this.fileDescriptor );
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public Close() : void
	{
		if ( !this.fileDescriptor )
		{
			console.error( `Logger need a static initialization` )
			return;
		}

		fs.closeSync( this.fileDescriptor );
	}

}