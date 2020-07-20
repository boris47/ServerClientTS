

import * as path from 'path';
import * as fs from 'fs';

import FSUtils from "../../../Common/Utils/FSUtils";

import GenericUtils, { ITemplatedObject, Yieldable } from '../../../Common/Utils/GenericUtils';
import { ServerUser, IServerUserBaseProps } from './Server.User';
import { ILifeCycleObject } from '../../../Common/Interfaces';
import { RequireStatics } from '../../../Common/Decorators';

/** Main process side storage */
@RequireStatics<ILifeCycleObject>()
export default class ServerUserDB
{
	private static m_Storage : Map<string, ServerUser> = new Map<string, ServerUser>();
	private static m_StorageName : string = '';
	private static m_IsInitialized : boolean = false;

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async Initialize() : Promise<boolean>
	{
		if ( ServerUserDB.m_IsInitialized )
		{
			return true;
		}

		const storageAbsolutepath = path.join( process.cwd(), 'Storage', `UserDB.json` );
		const folderPath = path.parse( storageAbsolutepath ).dir;
		await FSUtils.EnsureDirectoryExistence( folderPath );
		if ( !fs.existsSync( storageAbsolutepath ) )
		{
			fs.writeFileSync( storageAbsolutepath, "{}", 'utf8' );
		}
		ServerUserDB.m_StorageName = storageAbsolutepath;
		console.log( `ServerUserDB: Location: ${storageAbsolutepath}` );
		return true;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async Save() : Promise<boolean>
	{
		console.log(`Storage:Saving storage ${ServerUserDB.m_StorageName}`);
		const objectToSave : ITemplatedObject<IServerUserBaseProps> = {};
		for( const [userId, user] of ServerUserDB.m_Storage )
		{
			await Yieldable( () => objectToSave[user.id] = user );
		}

		const result : NodeJS.ErrnoException | null = await FSUtils.WriteFileAsync( ServerUserDB.m_StorageName, JSON.stringify( objectToSave, null, '\t' /*undefined*/ ) );
		console.log(`Storage:Storage ${ServerUserDB.m_StorageName} ${(!result ? 'saved':`not saved cause ${result}`)}`);
		return !result;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async Load() : Promise<boolean>
	{
		// Load storage file
		const filePath = ServerUserDB.m_StorageName;
		const parsedOrError : Error | ITemplatedObject<IServerUserBaseProps> = await FSUtils.ReadAndParse<ITemplatedObject<any>>( filePath );
		if ( GenericUtils.IsTypeOf(parsedOrError, Error) )
		{
			console.error( "ServerUserDB", 'Error reading local storage', parsedOrError );
			return false;
		}

		for( const [userId, { id, username, password }] of Object.entries(parsedOrError) )
		{
			await Yieldable( () =>
			{
				ServerUserDB.m_Storage.set( userId, new ServerUser( username, password, id ) );
			});
		}
		return true;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async Finalize(): Promise<boolean>
	{
		return ServerUserDB.Save();
	}

	//---------------------------------------------------------------

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async ClearStorage() : Promise<boolean>
	{
		ServerUserDB.m_Storage.clear();
		
		const folderPath = path.parse( ServerUserDB.m_StorageName ).dir;
		
		// Clear existing storage
		FSUtils.DeleteFolder( folderPath );

		// Re-create folder and file
		await FSUtils.EnsureDirectoryExistence( folderPath );
		if ( !fs.existsSync( ServerUserDB.m_StorageName ) )
		{
			fs.writeFileSync( ServerUserDB.m_StorageName, "{}", 'utf8' );
		}
		return true;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async AddUser( user : ServerUser, bForced : boolean = true ) : Promise<boolean>
	{
		const bAlreadyExists = ServerUserDB.m_Storage.has( user.id );
		if ( !bAlreadyExists || bForced )
		{
			ServerUserDB.m_Storage.set( user.id, user );
		}
		return true;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async UserExists( UserId : string ) : Promise<boolean>
	{
		return ServerUserDB.m_Storage.has( UserId );
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async ListUserIds() : Promise<string[]>
	{
		return Array.from(ServerUserDB.m_Storage.keys());
	}
	
	/////////////////////////////////////////////////////////////////////////////////////////
	public static async GetUser( userId : string ): Promise<ServerUser | null>
	{
		if ( await ServerUserDB.UserExists( userId ) )
		{
			return ServerUserDB.m_Storage.get( userId ) || null;
		}
		return null;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async GetUserByUsername( encryptedUsername: string ): Promise<ServerUser | null>
	{
		for( const [userId, user] of ServerUserDB.m_Storage )
		{
			if ( user.username === encryptedUsername ) return user;
		}
		return null;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async GetUsers( UserIds : string[] ) : Promise<( ServerUser | null )[]>
	{
		return ( await Promise.all( UserIds.map( k => ServerUserDB.GetUser(k) ) ) ).filter( s => !!s );
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async RemoveUser( userId : string ) : Promise<boolean>
	{
		return ServerUserDB.m_Storage.delete( userId );
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async RemoveUsers( UserIds : string[] ) : Promise<string[]>
	{
		const promises = new Array<Promise<boolean>>();
		const results = new Array<string>();
		UserIds.forEach( key =>
		{
			const promise = ServerUserDB.RemoveUser( key );
			promise.then( ( bResult: boolean ) => bResult ? results.push( key ) : null );
			promises.push( promise );
		});
		return Promise.all( promises ).then( () => results );
	}
}