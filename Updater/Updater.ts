
// stop program

// download main folder
// download other folders

// uncompress to destination folder

// run clean & compilation

// restart program


import * as fs from 'fs';
import * as path from 'path';
import * as ComUtils from '../Common/ComUtils';
import * as FSUtils from '../Common/FSUtils';
import * as GenericUtils from '../Common/GenericUtils';
import { ProcessManager } from '../Common/ProcessManager';
import { IPackageJSON } from '../Common/IPackageJSON';

const DOWNLOAD_LOCATION 		= path.join( process.cwd(), '../temp' );
const BASE_GIT_REPOS_API_URL 	= 'https://api.github.com/repos';

interface IGitFileRef
{
	name : string;
	path : string;
	sha : string;
	size : number;
	url : string;
	html_url : string;
	git_url : string;
	download_url : string;
	type : string;
	content : string;
	encoding : string;
	_links : {
		[key:string] : string
	}
}

async function MapRepository( url : string, user : string ) : Promise<(IGitFileRef | null)[]>
{
	const gitFilesMapped = new Array<IGitFileRef>();
	const dirsUrl = new Array<string>( ...[ url ] );
	while ( dirsUrl.length > 0 )
	{
		const dirToMap = dirsUrl.pop();
		const result : Buffer | null = await ComUtils.HTTP_Get( dirToMap, {	headers : { 'User-Agent': user } } );

		const resultParsed : IGitFileRef[] = JSON.parse( result?.toString() || null );
		if ( Array.isArray( resultParsed ) )
		{
			dirsUrl.push( ...resultParsed.filter( ( r : IGitFileRef ) => r.type === 'dir' ).map( d => d.url ) );
			gitFilesMapped.push( ...resultParsed.filter( ( r : IGitFileRef ) => r.type === 'file' ) );
		}
		else
		{
			console.error( `MapRepository:Expected array of items form dir '${dirToMap}' but received\n${result?.toString()}` );
			gitFilesMapped.push( null );
		}
	}
	/*
	{
		"name": "AWSUtils.ts",
		"path": "Server/Utils/AWSUtils.ts",
		"sha": "14c8d77fe5712939dde5bfb7ab6089f42e7be084",
		"size": 27698,
		"url": "https://api.github.com/repos/boris47/ServerClientTS/contents/Server/Utils/AWSUtils.ts?ref=master",
		"html_url": "https://github.com/boris47/ServerClientTS/blob/master/Server/Utils/AWSUtils.ts",
		"git_url": "https://api.github.com/repos/boris47/ServerClientTS/git/blobs/14c8d77fe5712939dde5bfb7ab6089f42e7be084",
		"download_url": "https://raw.githubusercontent.com/boris47/ServerClientTS/master/Server/Utils/AWSUtils.ts",
		"type": "file",
		"_links": {
			"self": "https://api.github.com/repos/boris47/ServerClientTS/contents/Server/Utils/AWSUtils.ts?ref=master",
			"git": "https://api.github.com/repos/boris47/ServerClientTS/git/blobs/14c8d77fe5712939dde5bfb7ab6089f42e7be084",
			"html": "https://github.com/boris47/ServerClientTS/blob/master/Server/Utils/AWSUtils.ts"
		}
    },
	*/
	return gitFilesMapped;
}

async function DownloadFiles( downloadLocation : string, user : string, fileRef : IGitFileRef ) : Promise<boolean>
{
	if ( !fileRef ) return false;

	const relativeFilePath = fileRef.path
	const fileUrlPath = fileRef.url;

	console.log( `DownloadFiles: Downloading '${relativeFilePath}' from '${fileUrlPath}'` );

	return ComUtils.HTTP_Get( fileUrlPath, { headers : { 'User-Agent': user } } ).then( ( result : Buffer | null ) =>
	{
		const fileref = <IGitFileRef>JSON.parse( result?.toString() || null );
		if ( !fileref || !fileref.content )
		{
			console.error( `DownloadFiles:Error: fileref is invalid:\n${JSON.stringify( fileref || {}, null, '\t' )}` );
			return false;
		}

		// Create folder tree if necessary
		const absoluteFilePath = path.join( downloadLocation, relativeFilePath );
		FSUtils.EnsureDirectoryExistence( path.parse( absoluteFilePath ).dir );
		
		// Apply decoding
		const content = Buffer.from( fileref.content, <BufferEncoding>fileref.encoding ).toString();
		return FSUtils.WriteFileAsync( absoluteFilePath, content )
		.then( ( result: FSUtils.IASyncFileOpResult ) => FSUtils.LogIfError( result ).bHasGoodResult );
	})
}

async function SyncRepositoryFolders( downloadLocation : string, user : string, repositoryName : string, mainFolder : string, otherFolders : string[] ) : Promise<boolean>
{
	// MAP FILE TO DONWLAOD
	const toFolderGitPath = ( u : string, r : string, fn : string ) => `${BASE_GIT_REPOS_API_URL}/${u}/${r}/contents/${fn}?ref=master`;
	const fileMapped : ( IGitFileRef | null )[] = await Promise.all
	(
		[ toFolderGitPath( user, repositoryName, mainFolder ), ...otherFolders.map( ( otherFolderName : string ) => toFolderGitPath( user, repositoryName, otherFolderName ) ) ]
		.map
		(
			( folderToMap : string ) => MapRepository( folderToMap, user )
		)
	).then( ( mappedArrays : IGitFileRef[][] ) => mappedArrays.reduce( ( previousValue: IGitFileRef[], currentValue: IGitFileRef[] ) => [ ...previousValue, ...currentValue ] ) )
	
	// DOWNLOAD THE MAPPED FILES
	return Promise.all
	(
		fileMapped.map
		(
			( fileMapped : IGitFileRef | null ) => DownloadFiles( downloadLocation, user, fileMapped )
		)
	).then( ( results : boolean []) => results.every( v => v ) );
}


async function UpdateSelf()
{

}


async function UpdateProgram() : Promise<boolean>
{
	//	const programDetilsText = fs.readFileSync( 0, 'utf-8' );
	//	const programDetilsParsed = JSON.parse( programDetilsText );
	const programDetailsParsed =
	{
		processDirectory : 'E:\\SourceTree\\ServerClientTS\\Server',
		name: 'Server',
		pid : 0, // Pheraps is useless
		user : 'boris47',
		repositoryName : 'ServerClientTS',
		mainFolder : 'Server',
		otherFolders : [/*'Common'*/]
	};
	const processDirectory			= programDetailsParsed.processDirectory;		// E:\\SourceTree\\ServerClientTS\\Server
	const processName				= programDetailsParsed.name;					// Server
	const user : string				= programDetailsParsed.user;					// boris47
	const repositoryName : string 	= programDetailsParsed.repositoryName	 		// ServerClientTS
	const mainFolder : string 		= programDetailsParsed.mainFolder;				// Server
	const otherFolders : string[] 	= programDetailsParsed.otherFolders;			// ['Common']
	FSUtils.DeleteContentFolder( DOWNLOAD_LOCATION );
	FSUtils.EnsureDirectoryExistence( DOWNLOAD_LOCATION );

	let bOverhaulResult = true;

	// Donwload Form repository
//	bOverhaulResult = bOverhaulResult && await SyncRepositoryFolders( DOWNLOAD_LOCATION, user, repositoryName, mainFolder, otherFolders );
	if ( bOverhaulResult && false )
	{
		{
			const destinationFolder = processDirectory;
			FSUtils.DeleteContentFolder( destinationFolder );
			FSUtils.EnsureDirectoryExistence( destinationFolder );
			const results : Map<string, (NodeJS.ErrnoException | null )> = await FSUtils.Copy( DOWNLOAD_LOCATION, destinationFolder, mainFolder );
			for( const [ fileRelativePath, error ] of results.entries() )
			{
				if ( error )
				{
					console.error( `Error copying ${fileRelativePath}: ${error.name}:${error.message}` );
				}
				else
				{
					console.log( `Copied ${fileRelativePath}` );
				}
			}
		}
		console.log( '.' ); console.log( '.' );
		/*
		for ( let index = 0; index < otherFolders.length; index++ )
		{
			const otherFolder = otherFolders[index];
			const destinationFolder = path.join( processDirectory.substring( 0, processDirectory.lastIndexOf('\\') ), otherFolder );
			FSUtils.DeleteContentFolder( destinationFolder );
			FSUtils.EnsureDirectoryExistence( destinationFolder );
			const results : Map<string, (NodeJS.ErrnoException | null )> = await FSUtils.Copy( DOWNLOAD_LOCATION, destinationFolder, otherFolder );
			for( const [ fileRelativePath, error ] of results.entries() )
			{
				if ( error )
				{
					console.error( `Error copying ${fileRelativePath}: ${error.name}:${error.message}` );
				}
				else
				{
					console.log( `Copied ${fileRelativePath}` );
				}
			}
		}
		*/
	}

	if ( bOverhaulResult )
	{
		// Restart Process
		const processSequence = new ProcessManager.ProcessSequence.Sequence( 'npm', [ 'install' ], undefined, processDirectory, false, false );
		processSequence.AddProcess( '"./node_modules/.bin/tsc.cmd"', [ '-p', 'tsconfig.json', '--watch', 'false' ], undefined, processDirectory, false, false );
		processSequence.SetEndSequenceCallback
		(
			(result : boolean) => ProcessManager.Spawn.SpawnAndLeave( 'node', [`Server.js`], undefined, processDirectory )
		);
		bOverhaulResult = bOverhaulResult && await processSequence.Execute();
	}
	return bOverhaulResult;
}


async function Execute()
{
	const args = process.argv.splice(2);
	if ( args.length === 0 )
	{
		return;
	}

	const bUpdateSelf = args.includes('--self');
	const bUpdateProgram = args.includes('--update');
	const bCheckVersion = args.includes('--version');

	if ( bUpdateSelf && bUpdateProgram && bCheckVersion )
	{
		return;
	}

	if ( bUpdateSelf )
	{
		const programDetailsParsed =
		{
			user : 'boris47',
			repositoryName : 'ServerClientTS',
			mainFolder : 'Updater',
		};
		const user : string				= programDetailsParsed.user;					// boris47
		const repositoryName : string 	= programDetailsParsed.repositoryName	 		// ServerClientTS
		const mainFolder : string 		= programDetailsParsed.mainFolder;				// Updater

		const requestUrl = `https://raw.githubusercontent.com/${user}/${repositoryName}/master/${mainFolder}/package.json`;
		const packageJsonBuffer : Buffer | null = await ComUtils.HTTP_Get( requestUrl,
		{
			headers : {
				'User-Agent': user
			}
		});
		const currentPackageJsonText : string | null = await FSUtils.ReadFileAsync( './package.json' ).then( ( result : FSUtils.IASyncFileOpResult ) => result.bHasGoodResult ? String( result.data ) : null );
		if ( packageJsonBuffer && currentPackageJsonText )
		{
			const packageJsonParsed = <IPackageJSON>JSON.parse( packageJsonBuffer.toString() );
			const currentPackageJson = JSON.parse( currentPackageJsonText ).version;
			const versionOnGithub = packageJsonParsed.version;
			const currentVersion = currentPackageJson.version;
			
		}
	}

	if ( bCheckVersion )
	{
		// const programDetailsText = fs.readFileSync( 0, 'utf-8' );
		// const programDetailsParsed = JSON.parse( programDetailsText );
		const programDetailsParsed =
		{
			user : 'boris47',
			repositoryName : 'ServerClientTS',
			mainFolder : 'Server',
		};
		const user : string				= programDetailsParsed.user;					// boris47
		const repositoryName : string 	= programDetailsParsed.repositoryName	 		// ServerClientTS
		const mainFolder : string 		= programDetailsParsed.mainFolder;				// Server

		const requestUrl = `https://raw.githubusercontent.com/${user}/${repositoryName}/master/${mainFolder}/package.json`;
		const packageJsonText : Buffer | null = await ComUtils.HTTP_Get( requestUrl,
		{
			headers : {
				'User-Agent': user
			}
		});
		if ( packageJsonText )
		{
			const packageJsonParsed = JSON.parse( packageJsonText.toString() );
			const version = packageJsonParsed.version;
			console.log( `VERSION=${version}` );
		}
	}

	if ( bUpdateProgram )
	{
		UpdateProgram();
	}
}

Execute();