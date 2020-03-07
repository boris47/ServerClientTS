
import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';

import * as FSutils from './FSUtils';
import { Logger } from './Logger';

/// WIP


export class ProcessKiller
{
	private processToKill : string = '';

	constructor( processToKill: string )
	{
		this.processToKill = processToKill;
	}
}


export class ProcessContainer
{
	public static async Execute( containerId : string, processToExecute: string, args:string[] = [], additionalEnvVars: Object = {}, processWorkDirAbsolutePath: string = process.cwd() ) : Promise<child_process.ChildProcess | null>
	{
		console.log( `ProcessContainer:Execute: Process to execute "${processToExecute}"` );

		const options: child_process.ExecOptions =
		{ // Options
			shell: process.env.ComSpec
			, cwd: processWorkDirAbsolutePath
			, env: Object.assign({}, process.env, additionalEnvVars)
			, maxBuffer: 1024 * 1024 * 100 // 10 MB buffer size
		};

		const child : child_process.ChildProcess | null = await new Promise<child_process.ChildProcess | null>( ( resolve ) =>
		{
			const child = child_process.fork
			(
				processToExecute,
				args,
				<child_process.ForkOptions>
				{
					cwd : processWorkDirAbsolutePath,
					env : Object.assign( {}, process.env, additionalEnvVars ),
					execArgv : [],
					silent : true
				}
			);
			resolve( child || null );
		});
		
		if ( child )
		{
			const bLoggerCreated = await Logger.Initialize( containerId );
			if ( !bLoggerCreated )
			{
				child.kill();
				return null;
			}
			console.log( `ProcessContainer: Process ${processToExecute} has PID "${child.pid}"` );
			
			child.stdout.setEncoding('utf8').on( 'data', ( chunk : string ) =>
			{
				chunk.split('\n').filter( l => l.length > 0 ).forEach( l =>console.log( `ProcessContainer:"${processToExecute}":STDOUT:${l}` ) );
			});
	
			child.stderr.setEncoding('utf8').on( 'data', ( chunk : string ) =>
			{
				chunk.split('\n').filter( l => l.length > 0 ).forEach( l =>console.error( `ProcessContainer:"${processToExecute}":STDERR:${l}` ) );
			});
	
			child.on( 'message', ( msg : child_process.Serializable ) =>
			{
				console.log( 'Message from child', msg );
			});
	
			child.on( 'unhandledRejection', ( reason: {} | null | undefined, promise: Promise<any> ) =>
			{
				console.log('ProcessContainer: Child Unhandled Rejection at:', promise, 'reason:', reason);
				// Application specific logging, throwing an error, or other logic here
			});
	
			child.on( 'uncaughtException', ( error: Error ) =>
			{
				console.log( `ProcessContainer: Child Uncaught Exception:\n${error.name}:${error.message}\n${error.stack}` );
			});
	
			child.on( 'error', ( err : Error ) =>
			{
				console.error( `ProcessContainer: Fail to start process ${processToExecute}!\n${err.name}:${err.message}`);
			});
	
			child.on( 'close', ( code : number, signal: NodeJS.Signals ) =>
			{
				console.log( `ProcessContainer: Process ${processToExecute} closed with code ${code}` );
			});
	
			child.on( 'exit', ( code: number | null, signal: NodeJS.Signals | null ) =>
			{
				console.log( `ProcessContainer: Process ${processToExecute} exited with code ${code}` );
			});
		}
		return child;
	}
}