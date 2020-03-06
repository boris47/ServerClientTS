
import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';

import * as FSutils from './FSUtils';

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
	public static async Execute( containerId : string, processToExecute: string, args:string[] = [], additionalEnvVars: Object = {}, processWorkDirAbsolutePath: string = process.cwd() ) : Promise<ProcessKiller | null>
	{
		console.log( `ProcessContainer:Execute: Process to execute "${processToExecute}"` );

		const options: child_process.ExecOptions =
		{ // Options
			shell: process.env.ComSpec
			, cwd: processWorkDirAbsolutePath
			, env: Object.assign({}, process.env, additionalEnvVars)
			, maxBuffer: 1024 * 1024 * 100 // 10 MB buffer size
		};


		const child = child_process.spawn
		(
			processToExecute,
			args,
			{
				cwd : processWorkDirAbsolutePath,
				env : Object.assign( {}, process.env, additionalEnvVars ),
				windowsHide : false,
				shell : process.env.ComSpec
			}
		);

		child.stdout.on( 'data', ( data : any ) =>
		{
			console.log( `${data}` );
		});

		child.stderr.on( 'data', ( data : any ) =>
		{
			console.error( `${data}` );
		});

		child.on( 'error', ( err : Error ) =>
		{
			console.error( `ProcessContainer:Execute: Fail to start process ${processToExecute}!\n${err.name}:${err.message}`);
		});

		child.on( 'close', ( code : number, signal: NodeJS.Signals ) =>
		{
			console.log( `ProcessContainer:Execute: Process ${processToExecute} exited with code ${code}` );
		});

		return null;
	}
}