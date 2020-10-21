
import * as fs from 'fs';
import * as path from 'path';

const ERROR_PREFIX = 'POSTINSTALL:DEV::ERROR ---------->';
const LOG_PREFIX = 'POSTINSTALL:DEV::LOG ---------->';
function LogError(message: string)
{
	console.error(`${ERROR_PREFIX} ${message}`);
}

function Log(message: string)
{
	console.log(`${LOG_PREFIX} ${message}`);
}


const ELECTRON_WEBPACK_PACKAGE_FOLDER = path.join('node_modules/electron-webpack');
const ELECTRON_WEBPACK_COMPILED_SOURCES = path.join( ELECTRON_WEBPACK_PACKAGE_FOLDER, 'out' );


const rendererTargetFilePath = path.join(ELECTRON_WEBPACK_COMPILED_SOURCES, 'targets', 'RendererTarget.js');
if (!fs.existsSync(rendererTargetFilePath))
{
	LogError('RendererTargetFilePath not exists');
	process.exit();
}

// Patching file 'RendererTarget.js'
const fileContent = fs.readFileSync(rendererTargetFilePath, 'utf8').split('\n');
{
	{ // Removing 'globalPaths' about line
		const index = fileContent.findIndex(line => line.includes('globalPaths'));
		if (index >= 0 )
		{
			Log("Replacing 'globalPaths' about line");
			fileContent.splice(index, 1);
		}
	}
	
	{ // Removing 'source-map-support' about line
		const index = fileContent.findIndex(line => line.includes('source-map-support'));
		if (index >= 0 )
		{
			Log("Replacing 'source-map-support' about line");
			fileContent.splice(index, 1);
		}
	}
}
fs.writeFileSync(rendererTargetFilePath, fileContent.join('\n'))