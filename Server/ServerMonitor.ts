
import * as fs from 'fs';
import { ProcessContainer } from '../Common/ProcessContainer';


if ( fs.existsSync( 'Server.js' ) )
{
	ProcessContainer.Fork.ForkProcess( 'ServerTS', './Server.js' )
	.then( ( forked : ProcessContainer.Fork.ForkedProcess ) =>
		{
			forked.SendMessage( ProcessContainer.Fork.EForkMessageType.UPDATE,
				( messsage : ProcessContainer.Fork.ISubProcessMessage ) =>
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
