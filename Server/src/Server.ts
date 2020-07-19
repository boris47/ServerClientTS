
import * as path from 'path';
import * as fs from 'fs';

import ServerConfigs from '../../Common/ServerConfigs'
import GenericUtils from '../../Common/Utils/GenericUtils';
import FSUtils from '../../Common/Utils/FSUtils';
import * as ComUtils from '../../Common/Utils/ComUtils';

import { MongoDatabase } from '../Utils/MongoDatabase';

import HttpModule from './Modules/Server.Modules.Http';
import WebSocketModule from './Modules/Server.Modules.WebSocket';
import { ServerInfo } from './Server.Globals';
import { StorageManager, EStorageType } from './Server.Storages';
import ServerUserDB from './Users/Server.User.DB';
import { ProcessManager } from '../../Common/ProcessManager';


// Very simple answer
process.on( 'message', ( message : any ) =>
{
	if ( message === 'update' )
	{
		const answer : ProcessManager.Fork.ISubProcessMessage =
		{
			processName : 'Server',
			msg : "Ciao mamma",
			msgType : message
		};
		process.send(answer);
	}
});




/*
process.on( 'uncaughtException', ( error: Error ) =>
{
	console.error( `Uncaught Exception:\n${error.name}\n${error.message}\n${error.stack}` );
	process.exit(1);
});

process.on( 'unhandledRejection', ( reason: {} | null | undefined, promise: Promise<any> ) =>
{
	console.error( 'Unhandled Rejection', reason, promise );
	process.exit(1);
});

process.on( 'multipleResolves', ( type: NodeJS.MultipleResolveType, promise: Promise<any>, value: any ) =>
{
	console.error( 'multipleResolves', type, promise, value );
});
*/


/**
 * The 'beforeExit' event is emitted when Node.js empties its event loop and has no additional work to schedule.
 * Normally, the Node.js process will exit when there is no work scheduled, but a listener registered on the 'beforeExit'
 * event can make asynchronous calls, and thereby cause the Node.js process to continue.
 * 
 * The 'beforeExit' event is not emitted for conditions causing explicit termination, such as calling process.exit() or uncaught exceptions.
 * The 'beforeExit' should not be used as an alternative to the 'exit' event unless the intention is to schedule additional work.
 *//*
process.on('beforeExit', ( code:number ) =>
{
	console.error( 'beforeExit' );
});
*/
/**
 * The 'exit' event is emitted when the Node.js process is about to exit as a result of either:
 * 
 * The process.exit() method being called explicitly;
 * - The Node.js event loop no longer having any additional work to perform.
 * - There is no way to prevent the exiting of the event loop at this point, and once all 'exit' listeners have finished running the Node.js process will terminate.
 * 
 * The listener callback function is invoked with the exit code specified either by the process.exitCode property, or the exitCode argument passed to the process.exit() method.
 * Listener functions must only perform synchronous operations.
 * The Node.js process will exit immediately after calling the 'exit' event listeners causing any additional work still queued in the event loop to be abandoned.
 *//*
process.on( 'exit', ( code: number ) =>
{
	console.error( 'exit' );
});
*/

type FinalizerContextType = { Finalize(...args:any[]) : any | Promise<any> };
interface IFinalizer
{
	context: FinalizerContextType;
	args?: any[];
}

class Finalizers
{
	private finalizers = new Array<IFinalizer>();

	public Add( context: FinalizerContextType, ...args: any[] )
	{
		this.finalizers.push( {context, args} );
	}

	public async Execute(cb?: Function): Promise<void>
	{
		let count = 0;
		console.log( `FINALIZATION START, count: ${this.finalizers.length}` );
		for( const {context, args} of this.finalizers )
		{
			await Promise.resolve(context.Finalize(...args)); // Promise.resolve Because can be a function or a promise
			console.log( `FINALIZATION: ${++count}/${this.finalizers.length}`);
			cb?.apply(null);
		}
		console.log( `FINALIZATION END` );
	}
}

class Server
{
	private finalizers = new Finalizers();

	/////////////////////////////////////////////////////////////////////////////////////////
	constructor()
	{
		let bIsTerminating = false;
		['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT','SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'].forEach((sig: any) =>
		{
			process.once(sig, () =>
			{
				if (!bIsTerminating)
				{
					this.finalizers.Execute();
					bIsTerminating = true;
				}
			});
		});
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	private FinalizationAndExit(exitCode: number)
	{
		this.finalizers.Execute().then( () => process.exit(exitCode) );
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	private async SaveMachinePublicIP(): Promise<boolean>
	{
		let bResult = true;
	//	const url_v6 = 'https://ipv6-api.speedtest.net/getip';
	//	const url_v4 = 'https://ipv4-api.speedtest.net/getip';
	//	const publicIPv6 : string | null = (await ComUtils.HTTP_Get( url_v6 ))?.toString()?.trim();
	//	const publicIPv4 : string | null = (await ComUtils.HTTP_Get( url_v4 ))?.toString()?.trim();
	//	
	//	if ( publicIPv6 )
	//	{
	//		console.log( "Server", 'publicIPv6', publicIPv6 );
	//		ServerInfo.MACHINE_PUBLIC_IPv6 = publicIPv6;
	//	}
	//	if ( publicIPv4 )
	//	{
	//		console.log( "Server", 'publicIPv4', publicIPv4 );
	//		ServerInfo.MACHINE_PUBLIC_IPv4 = publicIPv4;
	//	}
	//	if ( !publicIPv6 && !publicIPv4 )
	//	{
	//		console.error( `Cannot retrieve public ip` );
	//		bResult = false;
	//	}
		return bResult;
	}
	/////////////////////////////////////////////////////////////////////////////////////////
	private async UploadConfigurationFile() : Promise<boolean>
	{
		const serverConfigs = new ServerConfigs();
	//	serverConfigs.SetCurrentPublicIPv6( ServerInfo.MACHINE_PUBLIC_IPv6 );
	//	serverConfigs.SetCurrentPublicIPv4( ServerInfo.MACHINE_PUBLIC_IPv4 );
		serverConfigs.SetHTTPServerPort( ServerInfo.HTTP_SERVER_PORT );
		serverConfigs.SetWebSocketPort( ServerInfo.WEBSOCKET_SERVER_PORT );
		
		const filePath = "../Temp/ServerCfg.json";
		await FSUtils.EnsureDirectoryExistence( path.parse(filePath).dir );
		fs.writeFileSync( filePath, JSON.stringify( serverConfigs, null, '\t' ) );

		return true; //serverConfigs.AreValidData();
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public async Run(): Promise<void>
	{
		// LOGGER
	//	const bLoggerCreated = await Logger.Initialize( 'ServerTS', true );
	//	if ( !bLoggerCreated )
		{
		//	debugger; process.exit(1);
		}
	
		// Machine public ip
		if ( !await this.SaveMachinePublicIP() )
		{
			console.error( "Cannot find Public Ip" );
			debugger; return this.FinalizationAndExit(1);
		}
	
		// DATABASE
		const db : MongoDatabase = await MongoDatabase.CreateConnection( 'drrqi', 'boris47', 'JEBRBQANDcf3Jodj', 'db0' );
		if ( !db )
		{
			console.error( "Database Unavailable" );
			debugger; return this.FinalizationAndExit(1);
		}
		this.finalizers.Add(MongoDatabase, db );
	
		// STORAGES
		const localStorage = await StorageManager.CreateNewStorage( EStorageType.LOCAL, 'local' );
		const remoteStorage = await StorageManager.CreateNewStorage( EStorageType.REMOTE, 'remote' );
		const bResultServerUserDBInitialization = await ServerUserDB.Initialize();
		if ( !localStorage || !await localStorage.LoadStorage() )
		{
			console.error( "Local Storage Unavailable" );
			debugger; return this.FinalizationAndExit(1);
		}
		this.finalizers.Add( localStorage );
		if ( !remoteStorage || !await remoteStorage.LoadStorage() )
		{
			console.error( "Remote Storage Unavailable" );
			debugger; return this.FinalizationAndExit(1);
		}
		this.finalizers.Add( remoteStorage );
		if ( !bResultServerUserDBInitialization || !await ServerUserDB.Load() )
		{
			console.error( !bResultServerUserDBInitialization ? 'Server User DB Initialization Failed' : 'Server User DB Unavailable' );
			debugger; return this.FinalizationAndExit(1);
		}
		this.finalizers.Add( ServerUserDB );

		// MODULES
		if ( !await HttpModule.Initialize() )
		{
			console.error( "Cannot create server" );
			debugger; return this.FinalizationAndExit(1);
		}
		this.finalizers.Add( HttpModule );

		if ( !await WebSocketModule.Initialize() )
		{
			console.error( "Cannot create websocket" );
			debugger; return this.FinalizationAndExit(1);
		}
		this.finalizers.Add( WebSocketModule );

		if ( !await this.UploadConfigurationFile() )
		{
			console.error( "Cannot upload configuration file" );
			debugger; return this.FinalizationAndExit(1);
		}

		console.log("---- SERVER IS RUNNING ----");
		{
			this.ScheduleEvent( 60 * 1000, localStorage, localStorage.SaveStorage );
			this.ScheduleEvent( 60 * 1000, remoteStorage, remoteStorage.SaveStorage );
			this.ScheduleEvent( 60 * 1000, ServerUserDB, ServerUserDB.Save );

			let bRunning = true;
			this.finalizers.Add( { Finalize:() => bRunning = false } );

			// Server Loop
			while( bRunning ) await GenericUtils.WaitFrames( 1 );
			this.FinalizationAndExit(0);
		}
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	private async ScheduleEvent( delay: number, context: object, fn: (...args:any[]) => Promise<any>, ...args: any[] ): Promise<void>
	{
		let bContinuse = true;
		this.finalizers.Add( { Finalize:() => bContinuse = false } );
		while(bContinuse) await GenericUtils.DelayMS(delay).then(() => fn.apply(context, [args]));
	}
}

new Server().Run();