
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
	_links : {
		[key:string] : string
	}
}


async function MapRepository( url : string ) : Promise<IGitFileRef[]>
{
	const results = new Array<IGitFileRef>();
	const dirsUrl = new Array<string>( ...[ url ] );
	while( dirsUrl.length > 0 )
	{
		const result : Buffer | null = await ComUtils.HTTP_Get( dirsUrl.pop(), { 'User-Agent':'boris47' } );
		if( !result )
		{
			results.splice( 0, results.length );
			break;
		}

		const resultParsed = JSON.parse( result.toString() );
		resultParsed.forEach( ( r : IGitFileRef ) =>
		{
			if ( r.type === 'dir' )
			{
				dirsUrl.push( r.url );
			}
			else
			{
				results.push( r );
			}
		});
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
	return results;
}

async function DownloadFiles( downloadLocation : string, fileRefs : IGitFileRef[] ) : Promise<boolean>
{
	for( const fileRef of fileRefs )
	{
		const relativeFilePath = fileRef.path;
		const fileUrlPath = fileRef.url;
		console.log( `Downloading '${relativeFilePath}' from '${fileUrlPath}'` );
		const result : Buffer | null = await ComUtils.HTTP_Get( fileUrlPath );
		if ( result )
		{
			const absoluteFilePath = path.join( downloadLocation, relativeFilePath );
			const folderPath = path.parse( absoluteFilePath ).dir;
			FSUtils.EnsureDirectoryExistence( folderPath );
			fs.writeFileSync( absoluteFilePath, result );
		}
	};
	return true;
}

async function SyncRepositoryFolders( downloadLocation : string, user : string, repositoryName : string, mainFolder : string, otherFolder : string[] ) : Promise<boolean>
{
	let bGlobalResult = true;
	{
		const fullUrlMainFolder = `${BASE_GIT_REPOS_API_URL}/${user}/${repositoryName}/contents/${mainFolder}?ref=master`;
		const fileMap : IGitFileRef[] = await MapRepository( fullUrlMainFolder );
		bGlobalResult = bGlobalResult && await DownloadFiles( downloadLocation, fileMap );
	}

	bGlobalResult = bGlobalResult && await Promise.all
	(
		otherFolder.map( ( otherFolderName : string ) =>
		{
			const fullUrlMainFolder = `${BASE_GIT_REPOS_API_URL}/${user}/${repositoryName}/contents/${otherFolderName}?ref=master`;
			return MapRepository( fullUrlMainFolder ).then( ( fileRefs : IGitFileRef[] ) => DownloadFiles( downloadLocation, fileRefs ) );
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
	const bUpdateProgram = args.includes('--program');
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
		const packageJsonText : Buffer | null = await ComUtils.HTTP_Get( requestUrl );
		if( packageJsonText )
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
			pid : 0,
			user : 'boris47',
			repositoryName : 'ServerClientTS',
			mainFolder : 'Server',
			otherFolders : ['Common']
		};
		const processDirectory			= programDetailsParsed.processDirectory;		// E:\\SourceTree\\ServerClientTS\\Server
		const user : string				= programDetailsParsed.user;					// boris47
		const repositoryName : string 	= programDetailsParsed.repositoryName	 		// ServerClientTS
		const mainFolder : string 		= programDetailsParsed.mainFolder;				// Server
		const otherFolders : string[] 	= programDetailsParsed.otherFolders;			// ['Common']
		FSUtils.DeleteContentFolder( DOWNLOAD_LOCATION );
		FSUtils.EnsureDirectoryExistence( DOWNLOAD_LOCATION );
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
	}
}

Execute();