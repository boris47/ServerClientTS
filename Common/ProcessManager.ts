
import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';

import { Logger } from './Logger';


export namespace ProcessManager
{

	/////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////
	export namespace Fork
	{
		const PENDING_MESSAGE_TIMEOUT = 5000; // 30 minutes
		let MessageCheckRepeater : NodeJS.Timeout = null;

		type OnMessageReceived = ( message : ISubProcessMessage ) => void;
		interface IOnMessageReceivedCallback
		{
			processName : string;
			msg : string;
			onMessageReceived : OnMessageReceived;
		}

		/////////////////////////////////////////////////////////////////////////////////////////
		export enum EForkMessageType
		{
			UPDATE 				= 'update',
			EXIT 				= 'exit',
			CHECK 				= 'check',
			CLEANUP 			= 'cleanup',
			LOCK 				= 'lock',
			UNLOCK 				= 'unlock',
		};

		interface IPendingMessage
		{
			processName : string;
			msgType: EForkMessageType
			date : number;
			onReceived? : IOnMessageReceivedCallback | null;
			onTimeout : Function;
		}

		const PendingMessages : IPendingMessage[] = new Array<IPendingMessage>();

		export interface ISubProcessMessage
		{
			processName : string;
			msgType: EForkMessageType
			msg : string;
		}

		/////////////////////////////////////////////////////////////////////////////////////////
		const CheckTimedOutPendingMessages = () =>
		{
			for ( let i = PendingMessages.length - 1; i >= 0; i-- )
			{
				const message = PendingMessages[i];
				const dateNow = Date.now();
				const ver = message.date + PENDING_MESSAGE_TIMEOUT - dateNow;
				if ( ( message.date + PENDING_MESSAGE_TIMEOUT - dateNow ) < 0 )
				{
					message.onTimeout?.call(null);
					PendingMessages.splice( i, 1 );
				}
			}
		};


		/////////////////////////////////////////////////////////////////////////////////////////
		const SendMessage = async ( child: child_process.ChildProcess, processName: string, msgType : EForkMessageType, onMessageReceived? : OnMessageReceived, onTimeout? : Function ) : Promise<boolean> =>
		{
			if ( !MessageCheckRepeater )
			{
				MessageCheckRepeater = setInterval( CheckTimedOutPendingMessages, 1000 );
			}

			return new Promise<boolean>( resolve =>
			{
				child.send( msgType, ( error: Error ) =>
				{
					if ( error )
					{
						console.error( `ProcessManager:SendMessage: Cannot send message '${msgType}' to child '${processName}'\n${error.name}:${error.message}` );
					}
					else
					{
						const pendingMessage = <IPendingMessage>
						{
							msgType : msgType,
							processName : processName,
							date : Date.now(),
							onReceived : <IOnMessageReceivedCallback>
							{
								msg : msgType,
								processName : processName,
								onMessageReceived : onMessageReceived
							},
							onTimeout : onTimeout
						};
						PendingMessages.push( pendingMessage );
					}
					resolve( !error );
				});
			});
		};
	
		/////////////////////////////////////////////////////////////////////////////////////////
		export class ForkedProcess
		{
			private child : child_process.ChildProcess = null;
			private childName : string = '';
			private respawnFunction : () => child_process.ChildProcess		= null;
			private restartRequested : boolean = false;
	
			//
			constructor( child : child_process.ChildProcess, childName : string, respawnFunction : () => child_process.ChildProcess )
			{
				this.child = child;
				this.childName = childName;

				this.RegisterCallbacks();
			}


			//
			private RegisterCallbacks()
			{
				console.log( `ProcessManager::ForkedProcess: Process ${this.childName} has PID "${this.child.pid}"` );
				
				this.child.stdout.setEncoding('utf8').on( 'data', ( chunk : string ) =>
				{
					chunk.split('\n').filter( l => l.length > 0 ).forEach( l =>console.log( `ProcessManager::ForkedProcess:"${this.childName}":STDOUT:${l}` ) );
				});
		
				this.child.stderr.setEncoding('utf8').on( 'data', ( chunk : string ) =>
				{
					chunk.split('\n').filter( l => l.length > 0 ).forEach( l =>console.error( `ProcessManager::ForkedProcess:"${this.childName}":STDERR:${l}` ) );
				});

				this.child.on( 'message', ( message: child_process.Serializable ) =>
				{
					HandleReceivedMessage( message );
				});

				this.child.on( 'unhandledRejection', ( reason: {} | null | undefined, promise: Promise<any> ) =>
				{
					console.log('ProcessManager::ForkedProcess: Child Unhandled Rejection at:', promise, 'reason:', reason);
					// Application specific logging, throwing an error, or other logic here
				});
	
				this.child.on( 'uncaughtException', ( error: Error ) =>
				{
					console.log( `ProcessManager::ForkedProcess: Child Uncaught Exception:\n${error.name}:${error.message}\n${error.stack}` );
				});
	
				this.child.on( 'error', ( err : Error ) =>
				{
					console.error( `ProcessManager::ForkedProcess: Fail to start process ${this.childName}!\n${err.name}:${err.message}`);
				});
	
				this.child.on( 'close', ( code : number, signal: NodeJS.Signals ) =>
				{
					console.log( `ProcessManager::ForkedProcess: Process ${this.childName} closed with ` + (typeof code === 'number' ? `code : ${code}` : `signal ${signal}` ));

					if( this.restartRequested )
					{
						this.restartRequested = false;
						this.child = this.respawnFunction();
						this.RegisterCallbacks();
					}
				});
	
				this.child.on( 'exit', ( code: number | null, signal: NodeJS.Signals | null ) =>
				{
					console.log( `ProcessManager::ForkedProcess: Process ${this.childName} exited with ` + (typeof code === 'number' ? `code : ${code}` : `signal ${signal}` ));
				});
			}


			// 
			public RestartProcess() : void
			{
				this.restartRequested = true;
				
				// Before terminating the process sending exiting message in order to giv the process the time to do last things before exit
				this.SendMessage( EForkMessageType.EXIT, ( message: ISubProcessMessage ) =>
				{
					this.child.kill();
				},
				() =>	// On timeout
				{
					this.child.kill();
				});
			}


			//
			public async SendMessage( msg : EForkMessageType, onMessageReceived? : OnMessageReceived, onTimeout? : Function ) : Promise<boolean>
			{
				if ( Object.values( EForkMessageType ).includes( msg ) )
				{
					return SendMessage( this.child, this.childName, msg, onMessageReceived, onTimeout );
				}
				return false;
			}
		}


		/////////////////////////////////////////////////////////////////////////////////////////
		const HandleReceivedMessage = async ( message: child_process.Serializable ) =>
		{
			if ( typeof message !== 'object' )
			{
				console.error( `ProcessManager:Fork: Received an invalid message\n"${message}"` );
				return;
			}

			const messageParsed = <ISubProcessMessage> message;
			if ( !messageParsed.processName || !messageParsed.msgType || !messageParsed.msg )
			{
				console.error( `ProcessManager:Fork: Received a malformed object\n${JSON.stringify(message)}` );
				return;
			}

			const pendingMessage = PendingMessages.find( message => message.msgType === messageParsed.msgType && message.processName === messageParsed.processName );
			pendingMessage?.onReceived?.onMessageReceived( <ISubProcessMessage>message );
		}
	

		/////////////////////////////////////////////////////////////////////////////////////////
		export const ForkProcess = async ( containerId : string, processToExecute : string, args? : string[], additionalEnvVars? : Object, absoluteCWD? : string ) : Promise<ForkedProcess | null> =>
		{
			console.log( `ProcessManager:ForkProcess: Process to execute "${processToExecute}"` );

			const forkProcesss = () => child_process.fork
			(
				processToExecute,
				args || [],
				<child_process.ForkOptions>
				{
					cwd : absoluteCWD || process.cwd(),
					env : Object.assign( {}, process.env, additionalEnvVars || {} ),
					execArgv : [],
					silent : true
				}
			);

			const child = forkProcesss();
			if ( child )
			{
				const bLoggerCreated = await Logger.Initialize( containerId );
				if ( !bLoggerCreated )
				{
					child.kill();
					return null;
				}
				return new ForkedProcess( child, path.parse(processToExecute).name, forkProcesss );
			}
			return null;
		}


		/////////////////////////////////////////////////////////////////////////////////////////
//		export const ForkAndLeave = async ( processToExecute : string, args? : string[], additionalEnvVars? : Object, absoluteCWD? : string ) : Promise<boolean> =>
//		{
//			console.log( `ProcessManager:ForkAndLeave: Process to execute "${processToExecute}"` );
//			try
//			{
//				const child = child_process.fork
//				(
//					path.join( absoluteCWD || './', processToExecute ) /*processToExecute*/,
//					args || [],
//					<child_process.ForkOptions>
//					{
//		//				cwd : absoluteCWD || process.cwd(),
//		//				env : Object.assign( {}, process.env, additionalEnvVars || {} ),
//		//				execArgv : [],
//						detached : true,
//		//				silent : false, // If true, stdin, stdout, and stderr of the child will be piped to the parent, 
//		//				// otherwise they will be inherited from the parent, see the 'pipe' and 'inherit' options 
//		//				// for child_process.spawn()'s stdio for more details. Default: false.
//					}
//				)
//			//	child.disconnect();
//				child.unref();
//				return true;
//			}
//			catch ( e )
//			{
//				console.error( `Cannot fork and leave process ${e}` );
//			}
//			return false;
//		}

	}


	/////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////
	export namespace Spawn
	{

		/////////////////////////////////////////////////////////////////////////////////////////
		export interface ISpawnProcessResult
		{
			exitCode : number;
			stdOutput : string | null;
			stdError : string | null;
		}


		/////////////////////////////////////////////////////////////////////////////////////////
		export class SpawnedProcess
		{
			private child : child_process.ChildProcess						= null;
			private childName : string										= '';
			private respawnFunction : () => child_process.ChildProcess		= null;

			private restartRequested : boolean = false;
			private onExitOrClose : ( processResult : ISpawnProcessResult ) => void = _ => {}
			private internalFinishCallback : Function						= () => {};
			private processResult : ISpawnProcessResult						= <ISpawnProcessResult>{};
	

			//
			constructor( child : child_process.ChildProcess, childName : string, respawnFunction : () => child_process.ChildProcess )
			{
				this.child				= child;
				this.childName			= childName;
				this.respawnFunction	= respawnFunction;

				this.processResult = <ISpawnProcessResult>
				{
					exitCode : 0,
					stdError : null,
					stdOutput : ''
				};

				this.RegisterCallbacks();
			}


			public async AsPromise() : Promise<ISpawnProcessResult>
			{
				await new Promise<void> ( ( resolve ) =>
				{
					this.internalFinishCallback = resolve;
				});

				return this.processResult;
			}
			

			// 
			private RegisterCallbacks()
			{

				new Promise<void>( ( resolve ) =>
				{
					this.child.on( 'error', ( err : Error ) =>
					{
						this.processResult.stdError = `${err.name}:${err.message}`;
						this.processResult.exitCode = -1,
						console.error( `ProcessManager::SpawnedProcess: Fail to start process ${this.childName}!\n${err.name}:${err.message}`);
					});

					this.child.stdout.setEncoding('utf8').on( 'data', ( chunk : string ) =>
					{
						chunk.split('\n').filter( l => l.length > 0 ).forEach( l => 
						{
							this.processResult.stdOutput += `${l}\n`;
							console.log( `ProcessManager::SpawnedProcess:"${this.childName}":STDOUT:${l}` ) 
						});
					});
			
					this.child.stderr.setEncoding('utf8').on( 'data', ( chunk : string ) =>
					{
						chunk.split('\n').filter( l => l.length > 0 ).forEach( l =>
						{
							this.processResult.stdError = ( this.processResult.stdError ? this.processResult.stdError : '' ) + `${l}\n`;
							console.error( `ProcessManager::SpawnedProcess:"${this.childName}":STDERR:${l}` )
						});
					});
					/*
					this.child.on( 'close', ( code : number, signal: NodeJS.Signals ) =>
					{
						this.processResult.exitCode = code;
						console.log( `ProcessManager::SpawnedProcess: Process ${this.childName} closed with ` + (typeof code === 'number' ? `code : ${code}` : `signal ${signal}`) );
						this.internalFinishCallback();
						this.onExitOrClose( this.processResult );
						resolve();

					});
					*/
					this.child.on( 'exit', ( code: number | null, signal: NodeJS.Signals | null ) =>
					{
						this.processResult.exitCode = code || 0;
						console.log( `ProcessManager::SpawnedProcess: Process ${this.childName} exited with ` + (typeof code === 'number' ? `code : ${code}` : `signal ${signal}`) );
						this.internalFinishCallback();
						this.onExitOrClose( this.processResult );
						resolve();
						
						if( this.restartRequested )
						{
							this.restartRequested = false;
							this.child = this.respawnFunction();
							this.RegisterCallbacks();
						}
					});

				});
			}


			// 
			public RestartProcess() : void
			{
				this.restartRequested = true;
				this.child.kill();
			}


			//
			public OnExitOrClose( cb : ( processResult : ISpawnProcessResult ) => void )
			{
				this.onExitOrClose = cb || this.onExitOrClose;
			}
		}


		/////////////////////////////////////////////////////////////////////////////////////////
		export const SpawnProcess = ( processToExecute : string, args? : string[], additionalEnvVars? : Object, absoluteCWD? : string ) : SpawnedProcess =>
		{
			const spawmProcess = () => child_process.spawn
			(
				processToExecute,
				args || [],
				{
					shell: process.env.ComSpec,
					cwd : absoluteCWD || process.cwd(),
					env : Object.assign( {}, process.env, additionalEnvVars || {} ),
					argv0 : (args || []).join( ' ' )
				}
			);

			const child = spawmProcess();
			return new SpawnedProcess( child, path.join( absoluteCWD, processToExecute ), spawmProcess );
		}


		/////////////////////////////////////////////////////////////////////////////////////////
		export const SpawnAndLeave = ( processToExecute : string, args? : string[], additionalEnvVars? : Object, absoluteCWD? : string ) : boolean =>
		{
			console.log( `ProcessManager:SpawnAndLeave: Process to execute "${processToExecute}"` );
			try
			{
				const child = child_process.spawn
				(
					processToExecute,
					args || [],
					<child_process.SpawnOptions>
					{
						cwd : absoluteCWD || process.cwd(),
						shell: process.env.ComSpec,
						env : Object.assign( {}, process.env, additionalEnvVars || {} ),
						execArgv : [],
						detached : true,
						stdio: 'ignore',
				//		silent : false // If true, stdin, stdout, and stderr of the child will be piped to the parent, 
				//		// otherwise they will be inherited from the parent, see the 'pipe' and 'inherit' options 
				//		// for child_process.spawn()'s stdio for more details. Default: false.
					}
				);
				child.unref();
				return true;
			}
			catch ( e )
			{
				console.error( `Cannot spawn and leave process ${process}` );
			}
			return false;
		}

	}

	 
}
