
import * as path from 'path';
import * as fs from 'fs';

import FSUtils from "./Utils/FSUtils";
import { RequireStatics } from "./Decorators";
import GenericUtils, { ITemplatedObject } from './Utils/GenericUtils';

export interface IStorage
{
	Initialize(AppName: string, StorageName: string): Promise<boolean>;
	LoadStorage(): Promise<boolean>;
	SaveStorage(): Promise<boolean>;
	ClearStorage(): Promise<boolean>;
	AddResource(Key: string, data: Buffer, bForced?: boolean): Promise<boolean>;
	HasResource(Key: string): Promise<boolean>;
	ListResources(): Promise<string[]>;
	GetResource(Key: string): Promise<Buffer | null>;
	GetResources(Keys: string[]): Promise<(Buffer | null)[]>;
	RemoveResource(Key: string): Promise<boolean>;
	RemoveResources(Keys: string[]): Promise<string[]>;
	Finalize(): Promise<void>;
}


@RequireStatics<IStorage>()
export default class FS_Storage
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
		const storageAbsolutePath = path.join( userDataFolder, AppName, 'Storage', `${StorageName}.json` );
		const folderPath = path.parse( storageAbsolutePath ).dir;
		await FSUtils.EnsureDirectoryExistence( folderPath );
		if ( !fs.existsSync( storageAbsolutePath ) )
		{
			fs.writeFileSync( storageAbsolutePath, "{}", 'utf8' );
		}
		this.m_StorageName = storageAbsolutePath;
		console.log( `FS_Storage: Location: ${storageAbsolutePath}` );
		return this.m_IsInitialized = true;
	}
	
	/////////////////////////////////////////////////////////////////////////////////////////
	public static async LoadStorage() : Promise<boolean>
	{
		// Read file
		const readReasult: Buffer | NodeJS.ErrnoException = await FSUtils.ReadFileAsync( this.m_StorageName );
		if ( !GenericUtils.IsTypeOf(readReasult, Buffer) )
		{
			console.error( "FS_Storage", 'Error reading local storage', readReasult );
			return false;
		}
		
		// Parse Content
		const parsedOrError = GenericUtils.Parse<ITemplatedObject<number[]>>(readReasult.toString('utf-8'));
		if (GenericUtils.IsTypeOf(parsedOrError, Error))
		{
			console.error( parsedOrError );
			return false;
		}
		
		// Assign parsed
		for( const Key/*string*/in parsedOrError )
		{
			const buffer = parsedOrError[Key];
			this.m_Storage.set( Key, Buffer.from( buffer ) );
		}
		return true;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async SaveStorage() : Promise<boolean>
	{
		const objectToSave : ITemplatedObject<number[]> = {};
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

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async Finalize(): Promise<void>
	{
		await this.SaveStorage();
	}

}