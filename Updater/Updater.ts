
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
import { ProcessManager } from '../Common/ProcessManager';

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


async function MapRepository( url : string, user : string ) : Promise<IGitFileRef[]>
{
	const gitFilesMapped = new Array<IGitFileRef>(), dirsUrl = new Array<string>( ...[ url ] );
	while ( dirsUrl.length > 0 )
	{
		const result : Buffer | null = await ComUtils.HTTP_Get( dirsUrl.pop(),
		{
			headers : {
				'User-Agent': user,
				'Accept-Encoding': 'gzip, deflate, br',
				'Accept' : '*/*',
				'Cache-Control' : 'no-cache',
			}
		});
		if ( result )
		{
			const str = result.toString();
			const resultParsed : IGitFileRef[] = JSON.parse( str );
			if ( Array.isArray( resultParsed ) )
			{
				dirsUrl.push( ...resultParsed.filter( ( r : IGitFileRef ) => r.type === 'dir' ).map( d => d.url ) );
				gitFilesMapped.push( ...resultParsed.filter( ( r : IGitFileRef ) => r.type === 'file' ) );
			}
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


async function DownloadFiles( downloadLocation : string, user : string, fileRefs : IGitFileRef[] ) : Promise<boolean>
{
	return Promise.all
	(
		fileRefs.map( ( fileRef : IGitFileRef ) =>
		{
			const relativeFilePath = fileRef.path,  fileUrlPath = fileRef.url;
			console.log( `DownloadFiles: Downloading '${relativeFilePath}' from '${fileUrlPath}'` );
			return ComUtils.HTTP_Get( fileUrlPath,
			{
				headers : {
					'User-Agent': user,
				}
			} )
			.then( ( result : Buffer | null ) =>
			{
				if ( result )
				{
					const stringified = result.toString();
					const fileref = <IGitFileRef>JSON.parse( stringified );
					if ( !fileref.content )
					{
						console.error( `DownloadFiles:Error: Content undefined:\n${JSON.stringify( fileref, null, '\t' )}` );
						return false;
					}
					
					if ( !fileref.content ) debugger;

					const content = Buffer.from( fileref.content, <BufferEncoding>fileref.encoding ).toString();
					const absoluteFilePath = path.join( downloadLocation, relativeFilePath );
					const folderPath = path.parse( absoluteFilePath ).dir;
					FSUtils.EnsureDirectoryExistence( folderPath );

					return new Promise<boolean>( ( resolve ) =>
					{
						fs.writeFile( absoluteFilePath, content, ( err: NodeJS.ErrnoException ) =>
						{
							if ( err )
							{
								console.error( `DownloadFiles:Error: ${err.name}:${err.message}` );
							}
							resolve( !err );
						})
					});
				}
				return false;
			});
		})
	)
	.then( ( results : boolean[] ) => results.reduce( ( prev: boolean, curr : boolean ) => prev && curr, true ) );

//	let bResult = true;
//	for( const fileRef of fileRefs )
//	{
//		const relativeFilePath = fileRef.path,  fileUrlPath = fileRef.url;
//		console.log( `Downloading '${relativeFilePath}' from '${fileUrlPath}'` );
//		const result : Buffer | null = await ComUtils.HTTP_Get( fileUrlPath, { 'User-Agent': user } );
//		if ( result )
//		{
//			const stringified = result.toString();
//			const fileref = <IGitFileRef>JSON.parse( stringified );
//			if ( !fileref.content ) debugger;
//
//			const content = Buffer.from( fileref.content, <BufferEncoding>fileref.encoding ).toString();
//
//			const absoluteFilePath = path.join( downloadLocation, relativeFilePath );
//			const folderPath = path.parse( absoluteFilePath ).dir;
//			FSUtils.EnsureDirectoryExistence( folderPath );
//			fs.writeFileSync( absoluteFilePath, content );
//			bResult = bResult && ( content.length === fileRef.size );
//		}
//	};
//	return bResult;
}

async function SyncRepositoryFolders( downloadLocation : string, user : string, repositoryName : string, mainFolder : string, otherFolder : string[] ) : Promise<boolean>
{
	let bGlobalResult = true;
	{
		const fullUrlMainFolder = `${BASE_GIT_REPOS_API_URL}/${user}/${repositoryName}/contents/${mainFolder}?ref=master`;
		const fileMap : IGitFileRef[] = await MapRepository( fullUrlMainFolder, user );
		bGlobalResult = bGlobalResult && await DownloadFiles( downloadLocation, user, fileMap );
	}

	bGlobalResult = bGlobalResult && await Promise.all
	(
		otherFolder.map( ( otherFolderName : string ) =>
		{
			const fullUrlMainFolder = `${BASE_GIT_REPOS_API_URL}/${user}/${repositoryName}/contents/${otherFolderName}?ref=master`;
			return MapRepository( fullUrlMainFolder, user ).then( ( fileRefs : IGitFileRef[] ) => DownloadFiles( downloadLocation, user, fileRefs ) );
		})
	)
	.then( ( results : boolean[] ) => results.reduce( ( prev : boolean, curr : boolean ) => prev && curr, true ) );
	
	return bGlobalResult;
}


async function UpdateSelf()
{

}


async function UpdateProgram( programDetailsParsed : any ) : Promise<boolean>
{
	const user : string				= programDetailsParsed.user;					// boris47
	const repositoryName : string 	= programDetailsParsed.repositoryName	 		// ServerClientTS
	const mainFolder : string 		= programDetailsParsed.mainFolder;				// Server
	const otherFolders : string[] 	= programDetailsParsed.otherFolders;			// ['Common']
	return SyncRepositoryFolders( DOWNLOAD_LOCATION, user, repositoryName, mainFolder, otherFolders );
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

		// https://raw.githubusercontent.com/boris47/ServerClientTS/master/Server/Utils/AWSUtils.ts
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
			otherFolders : ['Common']
		};
		const processDirectory			= programDetailsParsed.processDirectory;		// E:\\SourceTree\\ServerClientTS\\Server
		const processName				= programDetailsParsed.name;					// Server
		const user : string				= programDetailsParsed.user;					// boris47
		const repositoryName : string 	= programDetailsParsed.repositoryName	 		// ServerClientTS
		const mainFolder : string 		= programDetailsParsed.mainFolder;				// Server
		const otherFolders : string[] 	= programDetailsParsed.otherFolders;			// ['Common']
		FSUtils.DeleteContentFolder( DOWNLOAD_LOCATION );
		FSUtils.EnsureDirectoryExistence( DOWNLOAD_LOCATION );

		// Donwload Form repository
		const bResult = await SyncRepositoryFolders( DOWNLOAD_LOCATION, user, repositoryName, mainFolder, otherFolders );
		if ( bResult )
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
			
		}

		// Restart Process
		{
			const bResult1 = await ProcessManager.Spawn.SpawnProcess( 'npm', ['install'], undefined, processDirectory ).AsPromise();
			const bResult2 = await ProcessManager.Spawn.SpawnProcess( '"./node_modules/.bin/tsc.cmd"', [
				'-p', 'tsconfig.json',
				'--watch', 'false'
			], undefined, processDirectory ).AsPromise();
			const bResult3 = ProcessManager.Spawn.SpawnAndLeave( 'node',  [`${processName}.js`], undefined, processDirectory );
			console.log(bResult1 && bResult2 && bResult3 );
		}
	}
}

Execute();