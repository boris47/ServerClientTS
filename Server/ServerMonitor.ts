
import * as child_process from 'child_process';
import * as fs from 'fs';
import { ProcessContainer } from '../Common/ProcessContainer';


if ( fs.existsSync( 'Server.js' ) )
{
	ProcessContainer.Execute( 'ServerTS', './Server.js' );
}

