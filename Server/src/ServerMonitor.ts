
import * as fs from 'fs';
import { ProcessManager } from '../../Common/ProcessManager';


if ( fs.existsSync( 'Server.js' ) )
{
	ProcessManager.Fork.ForkProcess( 'ServerTS', './Server.js' )
	.then( ( forked : ProcessManager.Fork.ForkedProcess ) =>
		{
			forked.SendMessage( ProcessManager.Fork.EForkMessageType.UPDATE,
				( messsage : ProcessManager.Fork.ISubProcessMessage ) =>
				{
					console.log( 'MONITOR received\n' + JSON.stringify( messsage, null, 4 ) );
				},
				() =>
				{
					console.log("MONITOR message 'update' not receive a response ");
				}
			);
		}
	);
}
