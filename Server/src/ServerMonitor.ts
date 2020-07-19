
import * as fs from 'fs';
import { ProcessManager } from '../../Common/ProcessManager';


if ( fs.existsSync( './src/Server.js' ) )
{
	ProcessManager.Fork.ForkProcess( 'ServerTS', './src/Server.js' )
	.then( ( forked : ProcessManager.Fork.ForkedProcess ) =>
		{
			const onMessageReceived = ( messsage : ProcessManager.Fork.ISubProcessMessage ) =>
			{
				console.log( 'MONITOR received\n' + JSON.stringify( messsage, null, 4 ) );
			};
			const onTimeout = () =>
			{
				console.log("MONITOR message 'update' not receive a response ");
			}
			return forked.SendMessage( ProcessManager.Fork.EForkMessageType.UPDATE, onMessageReceived, onTimeout );
		}
	);
}
