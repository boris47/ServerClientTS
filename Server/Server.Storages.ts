
import * as fs from 'fs';
import * as path from 'path';

import FSUtils from '../Common/Utils/FSUtils';
import GenericUtils, { GenericConstructor } from '../Common/Utils/GenericUtils';
import { AWSUtils } from './Utils/AWSUtils';
import { IIndexableObject } from '../Common/Interfaces';

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
	GetResource( Key : string ) : Promise<Buffer | null>;
	GetResources( Keys : string[] ) : Promise<(Buffer | null)[]>
	RemoveResource( Key : string ) : Promise<boolean>;
	RemoveResources( Key : string[] ) : Promise<string[]>;
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
		FSUtils.EnsureDirectoryExistence( folderPath );
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
				// TODO Handle this case
				console.error( "Server Storage", `Cannot load resources from file ${this.m_StorageName}` );
			}

			if ( parsed )
			{
				for( const Key in parsed )
				{
					const buffer = parsed[Key];
					this.m_Storage.set( Key, Buffer.from( buffer ) );
				}
			}
			return true;
		}
		return false;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public async SaveStorage() : Promise<boolean>
	{
		let objectToSave : IIndexableObject = {};
		this.m_Storage.forEach( ( value: Buffer, Key: string ) =>
		{
			objectToSave[Key] = value.toJSON().data;
		});

		const result : NodeJS.ErrnoException | null = await FSUtils.WriteFileAsync( this.m_StorageName, JSON.stringify( objectToSave, null, /*'\t'*/ undefined ) );
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
		FSUtils.EnsureDirectoryExistence( folderPath );
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
	public async GetResource( Key : string ) : Promise<Buffer | null>
	{
		if ( this.HasResource( Key ) )
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
		return AWSUtils.S3.UploadResource( this.s3Instance, this.bucketName, Key, Value );
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public async HasResource( Key : string ): Promise<boolean>
	{
		return !!AWSUtils.S3.GetObjectMetadata( this.s3Instance, this.bucketName, Key );
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public async GetResource( Key : string ) : Promise<Buffer | null>
	{
		return AWSUtils.S3.DownloadResource( this.s3Instance, this.bucketName, Key );
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public async GetResources( Keys : string[] ) : Promise<( Buffer | null )[]>
	{
		return AWSUtils.S3.DownloadResources( this.s3Instance, this.bucketName, Keys );
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public async RemoveResource( Key : string ): Promise<boolean>
	{
		return AWSUtils.S3.RemoveResource( this.s3Instance, this.bucketName, Key );
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public async RemoveResources( Keys : string[] ) : Promise<string[]>
	{
		return AWSUtils.S3.RemoveResources( this.s3Instance, this.bucketName, Keys );
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

		if ( storage )
		{
			if( await storage.Initialize( StorageName ) )
			{
				this.m_Storages.set( StorageName, storage );
			}
		}

		return storage;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static GetStorage( StorageName : string ) : IServerStorage | undefined
	{
		return this.m_Storages.get( StorageName );
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async CloseStorage( StorageName : string ) : Promise<boolean>
	{
		const storage : IServerStorage = this.m_Storages.get( StorageName );
		if ( storage )
		{
			if ( await storage.ClearStorage() )
			{
				this.m_Storages.delete( StorageName );
				return true;
			}
		}
		return false;
	}
}

