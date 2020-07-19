
import * as path from 'path';
import * as fs from 'fs';

import FSUtils from "../../../Common/Utils/FSUtils";
import { ITemplatedObject } from '../../../Common/Utils/GenericUtils';

/** Main process side storage */
export default class CustomFSStorage
{
	private static m_Storage : Map<string, Buffer> = new Map<string, Buffer>();
	private static m_StorageName : string = '';
	private static m_IsInitialized : boolean = false;

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async Initialize( AppName: string, StorageName : string ) : Promise<boolean>
	{
		if ( !process ) return false;
		if ( this.m_IsInitialized )
		{
			return true;
		}

		const userDataFolder = FSUtils.GetUserDataFolder();
		const storageAbsolutepath = path.join( userDataFolder, AppName, 'Storage', `${StorageName}.json` );
		const folderPath = path.parse( storageAbsolutepath ).dir;
		await FSUtils.EnsureDirectoryExistence( folderPath );
		if ( !fs.existsSync( storageAbsolutepath ) )
		{
			fs.writeFileSync( storageAbsolutepath, "{}", 'utf8' );
		}
		this.m_StorageName = storageAbsolutepath;
		console.log( `CustomLocalStorage: Location: ${storageAbsolutepath}` );
		global.customLocalStorage = this;
		return true;
	}
	
	/////////////////////////////////////////////////////////////////////////////////////////
	public static async LoadStorage() : Promise<boolean>
	{
		// Load storage file
		const filePath = this.m_StorageName;
		const readReasult: Buffer | NodeJS.ErrnoException = await FSUtils.ReadFileAsync( filePath );
		if ( Buffer.isBuffer(readReasult) )
		{
			const asString = readReasult.toString('utf-8');
			let parsed : ITemplatedObject<number[]> | null = null;
			try
			{
				parsed = JSON.parse( asString );
			}
			catch( e )
			{
				console.error( "CustomLocalStorage", `Cannot load resources from file ${this.m_StorageName}` );
				return false;
			}

			for( const Key/*string*/in parsed )
			{
				const buffer = parsed[Key];
				this.m_Storage.set( Key, Buffer.from( buffer ) );
			}
			return true;
		}

		console.error( "CustomLocalStorage", 'Error reading local storage', readReasult );
		return false;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async SaveStorage() : Promise<boolean>
	{
		let objectToSave : ITemplatedObject<number[]> = {};
		this.m_Storage.forEach( ( value: Buffer, Key: string ) =>
		{
			objectToSave[Key] = value.toJSON().data;
		});

		const result : NodeJS.ErrnoException | null = await FSUtils.WriteFileAsync( this.m_StorageName, JSON.stringify( objectToSave, null, /*'\t'*/ undefined ) );
		return !result;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async ClearStorage() : Promise<boolean>
	{
		this.m_Storage.clear();
		
		const folderPath = path.parse( this.m_StorageName ).dir;
		
		// Clear existing storage
		FSUtils.DeleteFolder( folderPath );

		// Re-create folder and file
		await FSUtils.EnsureDirectoryExistence( folderPath );
		if ( !fs.existsSync( this.m_StorageName ) )
		{
			fs.writeFileSync( this.m_StorageName, "{}", 'utf8' );
		}
		return true;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async AddResource( Key : string, data : Buffer, bForced : boolean = true ) : Promise<boolean>
	{
		const bAlreadyExists = this.m_Storage.has( Key );
		if ( !bAlreadyExists || bForced )
		{
			this.m_Storage.set( Key, data );
		}
		return true;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async HasResource( Key : string ) : Promise<boolean>
	{
		return this.m_Storage.has( Key );
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async ListResources() : Promise<string[]>
	{
		return Array.from(this.m_Storage.keys());
	}
	
	/////////////////////////////////////////////////////////////////////////////////////////
	public static async GetResource( Key : string ) : Promise<Buffer | null>
	{
		if ( await this.HasResource( Key ) )
		{
			return this.m_Storage.get( Key ) || null;
		}
		return null;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async GetResources( Keys : string[] ) : Promise<( Buffer | null )[]>
	{
		return ( await Promise.all( Keys.map( k => this.GetResource(k) ) ) ).filter( s => !!s );
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async RemoveResource( Key : string ) : Promise<boolean>
	{
		return this.m_Storage.delete( Key );
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async RemoveResources( Keys : string[] ) : Promise<string[]>
	{
		const promises = new Array<Promise<boolean>>();
		const results = new Array<string>();
		Keys.forEach( key =>
		{
			const promise = this.RemoveResource( key );
			promise.then( ( bResult: boolean ) => bResult ? results.push( key ) : null );
			promises.push( promise );
		});
		return Promise.all( promises ).then( () => results );
	}

}