

import * as path from 'path';
import * as fs from 'fs';

import FSUtils, { IEncodeAndWriteOptions, IReadAndParseOptions } from "../../../Common/Utils/FSUtils";

import GenericUtils, { ITemplatedObject, Yieldable } from '../../../Common/Utils/GenericUtils';
import { ServerUser, IServerUserBaseProps } from './Server.User';
import { ILifeCycleObject } from '../../../Common/Interfaces';
import { RequireStatics } from '../../../Common/Decorators';

/** Main process side storage */
@RequireStatics<ILifeCycleObject>()
export default class ServerUserDB
{
	private static CustomCryptoEnabled = true;
	private static passPhrase32Bit : string = `XC3r*Q5JKC?tqBb!6G-7uB@*7c=s?rV6`;
	private static iv: string = 'R^uexNY&925P@&x-';

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

		const storageAbsolutepath = path.join( process.cwd(), 'ServerStorage', `UserDB.json` );
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

		const content = JSON.stringify( objectToSave, null, '\t' /*undefined*/ );
		const options: IEncodeAndWriteOptions =
		{
			passPhrase32Bit: ServerUserDB.CustomCryptoEnabled ? ServerUserDB.passPhrase32Bit : undefined,
			iv: ServerUserDB.CustomCryptoEnabled ? ServerUserDB.iv : undefined
		};
		const result = await FSUtils.EncodeAndWrite( ServerUserDB.m_StorageName, content, options );
		console.log(`Storage:Storage ${ServerUserDB.m_StorageName} ${(!result ? 'saved':`not saved cause ${result}`)}`);
		return !result;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async Load() : Promise<boolean>
	{
		// Load storage file
		const options: IReadAndParseOptions<ITemplatedObject<IServerUserBaseProps>> =
		{
			bJson: true,
			passPhrase32Bit: ServerUserDB.CustomCryptoEnabled ? ServerUserDB.passPhrase32Bit : undefined,
			iv: ServerUserDB.CustomCryptoEnabled ? ServerUserDB.iv : undefined
		};
		const parsedOrError = await FSUtils.ReadAndParse( ServerUserDB.m_StorageName, options );
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
	public static AddUser( user : ServerUser, bForced : boolean = true ) : boolean
	{
		const bAlreadyExists = ServerUserDB.m_Storage.has( user.id );
		if ( !bAlreadyExists || bForced )
		{
			ServerUserDB.m_Storage.set( user.id, user );
		}
		return true;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static UserExists( UserId : string ) : boolean
	{
		return ServerUserDB.m_Storage.has( UserId );
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static GetUser( userId : string ): ServerUser | null
	{
		if ( ServerUserDB.UserExists( userId ) )
		{
			return ServerUserDB.m_Storage.get( userId ) || null;
		}
		return null;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static RemoveUser( userId : string ) : boolean
	{
		return ServerUserDB.m_Storage.delete( userId );
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async ListUserIds() : Promise<string[]>
	{
		const result = new Array<string>(ServerUserDB.m_Storage.size);
		for( const [userId, user] of ServerUserDB.m_Storage )
		{
			await Yieldable( () => result.push(userId));
		}
		return result;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async GetUserByUsername( encryptedUsername: string ): Promise<ServerUser | null>
	{
		let userFound = null;
		for( const [userId, user] of ServerUserDB.m_Storage )
		{
			if (userFound) break;
			await Yieldable( () => userFound = user.username === encryptedUsername ? user : null);
		}
		return userFound;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async GetUsers( UserIds : string[] ) : Promise<Map<string, ServerUser | null>>
	{
		const result = new Map<string, ServerUser | null>();
		for( const userId in UserIds )
		{
			await Yieldable(() => result.set( userId, ServerUserDB.GetUser(userId) ) );
		}
		return result;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async RemoveUsers( UserIds : string[] ) : Promise<Map<string, boolean>>
	{
		const result = new Map<string, boolean>();
		for( const userId in UserIds )
		{
			await Yieldable( () => result.set( userId, ServerUserDB.RemoveUser(userId) ) );
		}
		return result;
	}
}