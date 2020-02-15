

import * as fs from 'fs';
import * as path from 'path';

import * as FSUtils from '../Common/FSUtils';


export class ServerStorage {

	private static readonly m_StorageFilePath = './ServerStorage/Storage.json';

	// TODO Fix race condition
	private static m_Storage : Map<string, any> = new Map<string, any>();


	public static async CreateStorage() : Promise<void>
	{
		const folderPath = path.parse( this.m_StorageFilePath ).dir;
		FSUtils.EnsureDirectoryExistence( folderPath );
		if ( !fs.existsSync( this.m_StorageFilePath ) )
		{
			fs.writeFileSync( this.m_StorageFilePath, "[]", 'utf8' );
		}
	}

	public static async ClearStorage() : Promise<void>
	{
		this.m_Storage.clear();
		if ( fs.existsSync( this.m_StorageFilePath ) )
		{
			fs.unlinkSync( this.m_StorageFilePath );
		}
		/*
		fs.unlink( this.m_StorageFilePath, ( err: NodeJS.ErrnoException ) =>
		{
			console.log(err);
		} );
		*/
		const folderPath = path.parse( this.m_StorageFilePath ).dir;
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
			let parsed = null;
			try
			{
				parsed = JSON.parse( readReasult.data as string );
			}
			catch( e )
			{
				// TODO Handle this case
				console.error( "Server Storage", `Cannot load resources from file ${this.m_StorageFilePath}` );
			}

			if ( parsed )
			{
				let parsedArray : { key: string, value: any }[] = [];
				for (let index = 0; index < parsedArray.length; index++)
				{
					const element = parsedArray[index];
					this.m_Storage.set( element.key, element.value );
				}
				return true;
			}
		}
		return false;
	}


	public static AddEntry( key : string, data : any, bForced : boolean = false ) : void
	{
		const bAlreadyExists = this.m_Storage.has( key );
		if ( !bAlreadyExists || bForced )
		{
			this.m_Storage.set( key, data );
		}
	}


	public static RemoveEntry( key :  string ) : void
	{
		const bExists = this.m_Storage.has( key );
		if ( bExists )
		{
			this.m_Storage.delete( key );
		}
	}


	public static HasEntry( key : string ) : boolean
	{
		return this.m_Storage.has( key );
	}

	
	public static GetEntry( key : string ) : any | undefined
	{
		return this.m_Storage.get( key );
	}

}