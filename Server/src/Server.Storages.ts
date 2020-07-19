
import * as fs from 'fs';
import * as path from 'path';

import FSUtils from '../../Common/Utils/FSUtils';
import GenericUtils, { GenericConstructor, Yieldable } from '../../Common/Utils/GenericUtils';
import { AWSUtils } from '../Utils/AWSUtils';
import { IIndexableObject } from '../../Common/Interfaces';

export async function StorageFactory<T extends IServerStorage>( Class : GenericConstructor<T>, ...Args: any[] ) : Promise<T>
{
	return GenericUtils.Instanciate( Class, Args );
}

export enum EStorageType
{
	LOCAL,
	REMOTE
}

interface ILocalStorage
{
	/** Key : Uint8Array */
	[Key:string] : number[]
}

export interface IServerStorage
{
	Initialize( StorageName : string ) : Promise<boolean>;
	LoadStorage() : Promise<boolean>;
	SaveStorage() : Promise<boolean>;
	ClearStorage() : Promise<boolean>;
	AddResource( Key : string, Value : Buffer, bForced : boolean ) : Promise<boolean>;
	HasResource( Key : string ) : Promise<boolean>;
	ListResources() : Promise<string[]>;
	GetResource( Key : string ) : Promise<Buffer | null>;
	GetResources( Keys : string[] ) : Promise<(Buffer | null)[]>
	RemoveResource( Key : string ) : Promise<boolean>;
	RemoveResources( Key : string[] ) : Promise<string[]>;
	Finalize(): Promise<void>;
}

	/////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////    FS     ///////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////


class ServerStorage_FileSystem implements IServerStorage
{
	private m_Storage : Map<string, Buffer> = new Map<string, Buffer>();
	private m_StorageName : string = '';
	private m_IsInitialized : boolean = false;
	
	/////////////////////////////////////////////////////////////////////////////////////////
	public async Initialize( StorageName : string ) : Promise<boolean>
	{
		if ( this.m_IsInitialized )
			return true;
			
		const storageRelativePath = `./ServerStorage/${StorageName}.json`;
		const folderPath = path.parse( storageRelativePath ).dir;
		await FSUtils.EnsureDirectoryExistence( folderPath );
		if ( !fs.existsSync( storageRelativePath ) )
		{
			fs.writeFileSync( storageRelativePath, "{}", 'utf8' );
		}
		this.m_StorageName = storageRelativePath;
		return true;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public async LoadStorage() : Promise<boolean>
	{
		// Load storage file
		const filePath = this.m_StorageName;
		const readReasult: Buffer | NodeJS.ErrnoException = await FSUtils.ReadFileAsync( filePath );
		if ( Buffer.isBuffer(readReasult) )
		{
			const asString = readReasult.toString('utf-8');
			let parsed : ILocalStorage | null = null;
			try
			{
				parsed = JSON.parse( asString );
			}
			catch( e )
			{
				console.error( "Server Storage", `Cannot load resources from file ${this.m_StorageName}` );
				return false;
			}

			for( const Key/*string*/in parsed )
			{
				const buffer = parsed[Key];
				await Yieldable( () => this.m_Storage.set( Key, Buffer.from( buffer ) ) );
			}
			return true;
		}

		console.error( "Server Storage", 'Error reading local storage', readReasult );
		return false;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public async SaveStorage() : Promise<boolean>
	{
		let objectToSave : IIndexableObject = {};
		for( const [Key, value] of this.m_Storage )
		{
			await Yieldable( () => objectToSave[Key] = value.toJSON().data );
		}

		const result : NodeJS.ErrnoException | null = await FSUtils.WriteFileAsync( this.m_StorageName, JSON.stringify( objectToSave, null, /*'\t'*/ undefined ) );
		console.log(`Storage:Storage ${this.m_StorageName} ${(!result ? 'saved':`not saved cause ${result}`)}`);
		return !result;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public async ClearStorage() : Promise<boolean>
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
	public async AddResource( Key : string, data : Buffer, bForced : boolean = true ) : Promise<boolean>
	{
		const bAlreadyExists = this.m_Storage.has( Key );
		if ( !bAlreadyExists || bForced )
		{
			this.m_Storage.set( Key, data );
		}
		return true;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public async HasResource( Key : string ) : Promise<boolean>
	{
		return this.m_Storage.has( Key );
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public async ListResources() : Promise<string[]>
	{
		return Array.from(this.m_Storage.keys());
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public async GetResource( Key : string ) : Promise<Buffer | null>
	{
		if ( await this.HasResource( Key ) )
		{
			return this.m_Storage.get( Key ) || null;
		}
		return null;
	}
	
	/////////////////////////////////////////////////////////////////////////////////////////
	public async GetResources( Keys : string[] ) : Promise<( Buffer | null )[]>
	{
		return ( await Promise.all( Keys.map( k => this.GetResource(k) ) ) ).filter( s => !!s );
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public async RemoveResource( Key : string ) : Promise<boolean>
	{
		return this.m_Storage.delete( Key );
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public async RemoveResources( Keys : string[] ) : Promise<string[]>
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
	public async Finalize(): Promise<void>
	{
		await this.SaveStorage();
	}
}


/////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////    AWS    ///////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////

class ServerStorage_AWS implements IServerStorage
{
	private s3Instance : AWS.S3 = null;
	private bucketName : string = null;
	private m_IsInitialized : boolean = false;
	
	/////////////////////////////////////////////////////////////////////////////////////////
	public async Initialize( StorageName : string ): Promise<boolean>
	{
		if ( this.m_IsInitialized )
			return true;

		this.bucketName = StorageName;
		this.s3Instance = AWSUtils.S3.CreateInstance( '', '', '' );
		return true; //TODO Create bucket
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public async LoadStorage(): Promise<boolean>
	{
		return true; // nothing to load
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public async SaveStorage(): Promise<boolean>
	{
	//	console.log(`Storage:Saving storage ${this.bucketName}`);
	//	console.log(`Storage:Storage ${this.bucketName} saved`);
		return true; // nothing to save
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public async ClearStorage(): Promise<boolean>
	{
		return true; // absolutely no!
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public async AddResource( Key : string, Value : Buffer, bForced : boolean ): Promise<boolean>
	{
		const error : AWS.AWSError | null = await AWSUtils.S3.UploadResource( this.s3Instance, this.bucketName, Key, Value );
		return !!error;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public async HasResource( Key : string ): Promise<boolean>
	{
		return !!AWSUtils.S3.GetObjectMetadata( this.s3Instance, this.bucketName, Key );
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public async ListResources() : Promise<string[]>
	{
		const results : AWS.AWSError | AWS.S3.Object[] = await AWSUtils.S3.ListObjects( this.s3Instance, this.bucketName );
		return Array.isArray(results) ? results.map( r => r.Key ) : [];
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public async GetResource( Key : string ) : Promise<Buffer | null>
	{
		const result : AWS.AWSError | Buffer = await AWSUtils.S3.DownloadResource( this.s3Instance, this.bucketName, Key );
		return Buffer.isBuffer(result) ? result : null;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public async GetResources( Keys : string[] ) : Promise<( Buffer | null )[]>
	{
		const result : (Buffer | AWS.AWSError)[] = await AWSUtils.S3.DownloadResources( this.s3Instance, this.bucketName, Keys );
		return result.map( v => Buffer.isBuffer(v) ? v : null );
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public async RemoveResource( Key : string ): Promise<boolean>
	{
		const result : AWS.AWSError | null = await AWSUtils.S3.RemoveResource( this.s3Instance, this.bucketName, Key );
		return !result;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public async RemoveResources( Keys : string[] ) : Promise<string[]>
	{
		const results : (string | AWS.AWSError)[] = await AWSUtils.S3.RemoveResources( this.s3Instance, this.bucketName, Keys );
		return results.map( v => typeof v === 'string' ? v : null ).filter( v => v );
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public async Finalize(): Promise<void>
	{
		this.SaveStorage();
	}
}


export class StorageManager
{
	private static m_Storages = new Map<string, IServerStorage>();

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async CreateNewStorage( type: EStorageType, StorageName : string ) : Promise<IServerStorage | null>
	{
		let storage : IServerStorage | null = null;
		switch (type)
		{
			case EStorageType.LOCAL:
			{
				storage = new ServerStorage_FileSystem();
				break;
			}
			case EStorageType.REMOTE:
			{
				storage = new ServerStorage_AWS();
				break;
			}
		}

		let binitialized = true;
		if ( storage )
		{
			if( binitialized = await storage.Initialize( StorageName ) )
			{
				StorageManager.m_Storages.set( StorageName, storage );
			}
		}

		console.log( `Storage ${type} Created and Initialized` );
		return binitialized ? storage : null;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static GetStorage( StorageName : string ) : IServerStorage | undefined
	{
		return StorageManager.m_Storages.get( StorageName );
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async CloseStorage( StorageName : string ) : Promise<boolean>
	{
		const storage : IServerStorage = StorageManager.m_Storages.get( StorageName );
		if ( storage )
		{
			await storage.SaveStorage();
			if ( await storage.ClearStorage() )
			{
				StorageManager.m_Storages.delete( StorageName );
				return true;
			}
		}
		return false;
	}
}

