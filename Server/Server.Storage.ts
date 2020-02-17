

import * as fs from 'fs';
import * as path from 'path';

import * as FSUtils from '../Common/FSUtils';


export class ServerStorage {

	private static readonly m_StorageFilePath = './ServerStorage/Storage.json';

	// TODO Fix race condition
	private static m_Storage : Map<string, string> = new Map<string, string>();


	public static async CreateStorage() : Promise<void>
	{
		const folderPath = path.parse( ServerStorage.m_StorageFilePath ).dir;
		FSUtils.EnsureDirectoryExistence( folderPath );
		if ( !fs.existsSync( ServerStorage.m_StorageFilePath ) )
		{
			fs.writeFileSync( ServerStorage.m_StorageFilePath, "{}", 'utf8' );
		}
	}

	public static async ClearStorage() : Promise<void>
	{
		ServerStorage.m_Storage.clear();
		if ( fs.existsSync( ServerStorage.m_StorageFilePath ) )
		{
			fs.unlinkSync( ServerStorage.m_StorageFilePath );
		}
		/*
		fs.unlink( ServerStorage.m_StorageFilePath, ( err: NodeJS.ErrnoException ) =>
		{
			console.log(err);
		} );
		*/
		const folderPath = path.parse( ServerStorage.m_StorageFilePath ).dir;
		if ( fs.existsSync( folderPath ) )
		{
			fs.rmdirSync( folderPath );
		}
	}


	public static async Load() : Promise<boolean>
	{
		// Load storage file
		const filePath = ServerStorage.m_StorageFilePath;
		const readReasult = await FSUtils.ReadFileAsync( filePath );
		if ( readReasult.bHasGoodResult )
		{
			if( readReasult.data === "" )
			{
				readReasult.data = '{}';
			}
			let parsed : { [key:string] : string } = null;
			try
			{
				parsed = JSON.parse( readReasult.data as string );
			}
			catch( e )
			{
				// TODO Handle this case
				console.error( "Server Storage", `Cannot load resources from file ${ServerStorage.m_StorageFilePath}` );
			}

			if ( parsed )
			{
				for( const key in parsed )
				{
					const value = parsed[key];
					ServerStorage.m_Storage.set( key, value );
				}
				return true;
			}
		}
		return false;
	}

	public static async Save() : Promise<boolean>
	{
		let objectToSave = {};
		ServerStorage.m_Storage.forEach( ( value: string, key: string ) =>
		{
			objectToSave[key] = value;
		});

		const bResult = await new Promise<boolean>( ( resolve ) =>
		{
			fs.writeFile( ServerStorage.m_StorageFilePath, JSON.stringify( objectToSave, null, '\t' ), ( err: NodeJS.ErrnoException ) =>
			{
				resolve(!err);
			})
		});

		return bResult;
	}


	public static AddEntry( key : string, data : string, bForced : boolean = false ) : void
	{
		const bAlreadyExists = ServerStorage.m_Storage.has( key );
		if ( !bAlreadyExists || bForced )
		{
			ServerStorage.m_Storage.set( key, data.toString() );
		}
	}


	public static RemoveEntry( key : string ) : void
	{
		const bExists = ServerStorage.m_Storage.has( key );
		if ( bExists )
		{
			ServerStorage.m_Storage.delete( key );
		}
	}


	public static HasEntry( key : string ) : boolean
	{
		return ServerStorage.m_Storage.has( key );
	}

	
	public static GetEntry( key : string ) : string | undefined
	{
		return ServerStorage.m_Storage.get( key );
	}

}