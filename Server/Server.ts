
import * as http from 'http';

import * as fs from 'fs';

import GenericUtils from '../Common/Utils/GenericUtils';
import * as ComUtils from '../Common/Utils/ComUtils';
import ServerConfigs from '../Common/ServerConfigs'

import { StorageManager, EStorageType } from './Server.Storages';

import { MongoDatabase } from './Utils/MongoDatabase';

import { Logger } from '../Common/Logger';
import { ServerInfo } from './Server.Globals';
import HttpModule from './Server.HttpModule';
import WebSocketModule from './Server.WebSocketModule';

/*
// Very simple answer
process.on( 'message', ( message : any ) =>
{
	if ( message === 'update' )
	{
		process.send( <ProcessManager.Fork.ISubProcessMessage>
		{
			processName : 'Server',
			msg : "Ciao mamma",
			msgType : message
		});
	}
});
*/


/////////////////////////////////////////////////////////////////////////////////////////
async function UploadConfigurationFile() : Promise<boolean>
{
	const serverConfigs = new ServerConfigs();
	serverConfigs.SetCurrentPublicIP( ServerInfo.MACHINE_PUBLIC_IP );
	serverConfigs.SetHTTPServerPort( ServerInfo.HTTP_SERVER_PORT );
	serverConfigs.SetWebSocketPort( ServerInfo.WEBSOCKET_SERVER_PORT );
	
	const fileName = "./ServerCfg.json";
	fs.writeFileSync( fileName, JSON.stringify( serverConfigs, null, '\t' ) );

	return serverConfigs.AreValidData();
}


/////////////////////////////////////////////////////////////////////////////////////////
async function SaveMachinePublicIP(): Promise<boolean>
{
	let bResult = true;
///	const url_v6 = 'https://ipv6-api.speedtest.net/getip';
	const url_v4 = 'https://ipv4-api.speedtest.net/getip';
///	const publicIPv6 : string | null = (await ComUtils.HTTP_Get( url_v6 ))?.toString()?.trim();
	const publicIPv4 : string | null = (await ComUtils.HTTP_Get( url_v4 ))?.toString()?.trim();
	
///	if ( publicIPv6 )
	{
///		console.log( "Server", 'publicIPv6', publicIPv6 );
///		ServerInfo.HTTP_SERVER_ADDRESS = publicIPv6;
	}
	/*else*/ if ( publicIPv4 )
	{
		console.log( "Server", 'publicIPv4', publicIPv4 );
		ServerInfo.MACHINE_PUBLIC_IP = publicIPv4;
	}
	else
	{
		console.error( `Cannot retrieve public ip` );
		bResult = false;
	}

	return bResult;
}


async function Main()
{
	// LOGGER
//	const bLoggerCreated = await Logger.Initialize( 'ServerTS', true );
//	if ( !bLoggerCreated )
	{
//		debugger;
//		return process.exit(1);
	}

	// Machine public ip
	{
		const bResult = await SaveMachinePublicIP();
		if ( !bResult )
		{
			console.error( "Cannot find Public Ip" );
			debugger;
			return process.exit(1);
		}
	}

	// DATABASE
	{
		const db : MongoDatabase = await MongoDatabase.CreateConnection( 'drrqi', 'boris47', 'JEBRBQANDcf3Jodj', 'db0' );
		if ( !db )
		{
			console.error( "Database Unavailable" );
			debugger;
			process.exit(1);
		}
	}

	const localStorage = await StorageManager.CreateNewStorage( EStorageType.LOCAL, 'local' );
	const remoteStorage = await StorageManager.CreateNewStorage( EStorageType.REMOTE, 'remote' );
	{
		const bResultLocal = await localStorage.LoadStorage();
		if ( !bResultLocal )
		{
			console.error( "Local Storage Unavailable" );
			debugger;
			return process.exit(1);
		}
		
		const bResultRemote = await remoteStorage.LoadStorage();
		if ( !bResultRemote )
		{
			console.error( "Remote Storage Unavailable" );
			debugger;
			return process.exit(1);
		}
	}

	{	
		const bResult = await HttpModule.Initialize();
		if ( !bResult )
		{
			console.error( "Cannot create server" );
			debugger;
			return process.exit(1);
		}
	}

	{
		const bResult = await WebSocketModule.Initialize();
		if ( !bResult )
		{
			console.error( "Cannot create websocket" );
			debugger;
			return process.exit(1);
		}
	}

	{
		const bHasCommittedConfigFile = await UploadConfigurationFile();
		if ( !bHasCommittedConfigFile )
		{
			console.error( "Cannot upload configuration file" );
			debugger;
			return process.exit(1);
		}
	}

	console.log("---- SERVER IS RUNNING ----");

	{
		while( true )
		{
			await GenericUtils.DelayMS( 5000 );
	
			await localStorage.SaveStorage();
		}
	}

}


process.on( 'uncaughtException', ( error: Error ) =>
{
	console.error( `Uncaught Exception:\n${error.name}\n${error.message}\n${error.stack}` );
	process.exit(1);
});


process.on( 'unhandledRejection', ( reason: {} | null | undefined, promise: Promise<any> ) =>
{
	console.error( 'Unhandled Rejection' );
	process.exit(1);
});

process.on( 'multipleResolves', ( type: NodeJS.MultipleResolveType, promise: Promise<any>, value: any ) =>
{
	console.error( 'multipleResolves', type, promise, value );
});


// catching signals and do something before exit
['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT','SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'].forEach(function (sig:string)
{
	process.on(sig as any, function ()
	{
		terminator(sig);
	});
});


function terminator(sig: string)
{
	Promise.resolve()
	.then( _ => HttpModule.Finalize() )
	.then( _ => WebSocketModule.Finalize() )
	.then(  _ => process.exit(1) );
}


/**
 * The 'beforeExit' event is emitted when Node.js empties its event loop and has no additional work to schedule.
 * Normally, the Node.js process will exit when there is no work scheduled, but a listener registered on the 'beforeExit'
 * event can make asynchronous calls, and thereby cause the Node.js process to continue.
 * 
 * The 'beforeExit' event is not emitted for conditions causing explicit termination, such as calling process.exit() or uncaught exceptions.
 * The 'beforeExit' should not be used as an alternative to the 'exit' event unless the intention is to schedule additional work.
 */
process.on('beforeExit', ( code:number ) =>
{
	console.error( 'beforeExit' );
});

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
 */
process.on( 'exit', ( code: number ) =>
{
	console.error( 'exit' );
});


Main();