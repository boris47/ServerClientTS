
import * as path from 'path';
import * as child_process from 'child_process';

import { Logger } from './Logger';


export namespace ProcessContainer
{

	/////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////
	export namespace Fork
	{
		const PENDING_MESSAGE_TIMEOUT = 3600;

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
			onReceived? : IOnMessageReceivedCallback | null
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
				if ( message.date + PENDING_MESSAGE_TIMEOUT > Date.now() )
				{
					PendingMessages.splice( 1, i );
				}
			}
		};


		/////////////////////////////////////////////////////////////////////////////////////////
		const SendMessage = async ( child: child_process.ChildProcess, processName: string, msgType : EForkMessageType, onMessageReceived? : OnMessageReceived | null ) : Promise<boolean> =>
		{
			return new Promise<boolean>( resolve =>
			{
				child.send( msgType, ( error: Error ) =>
				{
					if ( error )
					{
						console.error( `ProcessContainer:SendMessage: Cannot send message '${msgType}' to child '${processName}'\n${error.name}:${error.message}` );
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
							}
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
	
			//
			constructor( child : child_process.ChildProcess, childName : string )
			{
				this.child = child;
				this.childName = childName;
			}

			//
			public async SendMessage( msg : EForkMessageType, onMessageReceived? : OnMessageReceived ) : Promise<boolean>
			{
				if ( Object.values( EForkMessageType ).includes( msg ) )
				{
					return SendMessage( this.child, this.childName, msg, onMessageReceived );
				}
				return false;
			}
		}


		/////////////////////////////////////////////////////////////////////////////////////////
		const HandleReceivedMessage = async ( message: child_process.Serializable ) =>
		{
			if ( typeof message !== 'object' )
			{
				console.error( `ProcessContainer:Fork: Received an invalid message\n"${message}"` );
				return;
			}

			const messageParsed = <ISubProcessMessage> message;
			if ( !messageParsed.processName || !messageParsed.msgType || !messageParsed.msg )
			{
				console.error( `ProcessContainer:Fork: Received a malformed object\n${JSON.stringify(message)}` );
				return;
			}

			const pendingMessage = PendingMessages.find( message => message.msgType === messageParsed.msgType && message.processName === messageParsed.processName );
			pendingMessage?.onReceived?.onMessageReceived( <ISubProcessMessage>message );

			CheckTimedOutPendingMessages();
		}
	

		/////////////////////////////////////////////////////////////////////////////////////////
		export const ForkProcess = async ( containerId : string, processToExecute : string, args? : string[], additionalEnvVars? : Object, absoluteCWD? : string ) : Promise<ForkedProcess | null> =>
		{
			console.log( `ProcessContainer:ForkProcess: Process to execute "${processToExecute}"` );

			const child = child_process.fork
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

				child.on( 'message', ( message: child_process.Serializable ) =>
				{
					HandleReceivedMessage( message );
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
					console.log( `ProcessContainer: Process ${processToExecute} closed with ` + code ? `code : ${code}` : `signal ${signal}` );
				});
	
				child.on( 'exit', ( code: number | null, signal: NodeJS.Signals | null ) =>
				{
					console.log( `ProcessContainer: Process ${processToExecute} exited with ` + code ? `code : ${code}` : `signal ${signal}` );
				});

				return new ForkedProcess( child, path.parse(processToExecute).name );
			}
	
			return null;
		}
		
	}


	 
}
