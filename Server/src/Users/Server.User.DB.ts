

import * as path from 'path';
import * as fs from 'fs';

import FSUtils from "../../../Common/Utils/FSUtils";

import GenericUtils, { ITemplatedObject, Yieldable, CustomCrypto } from '../../../Common/Utils/GenericUtils';
import StringUtils from '../../../Common/Utils/StringUtils';
import { ServerUser, IServerUserBaseProps } from './Server.User';
import { ILifeCycleObject } from '../../../Common/Interfaces';
import { RequireStatics } from '../../../Common/Decorators';
import { IPackageJSON } from '../../../Common/IPackageJSON';
const { config: { name } }: IPackageJSON = require('../../package.json');


/** Main process side storage */
@RequireStatics<ILifeCycleObject>()
export default class ServerUserDB
{
	private static CustomCryptoEnabled = false;
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
		const userDataFolder = FSUtils.GetUserDataFolder();
		const storageAbsolutePath = path.join( userDataFolder, name, 'Storage', `UserDB.json` );
	//	const storageAbsolutePath = path.join( process.cwd(), 'ServerStorage', `UserDB.json` );
		const folderPath = path.parse( storageAbsolutePath ).dir;
		await FSUtils.EnsureDirectoryExistence( folderPath );
		
//		const content = ServerUserDB.CustomCryptoEnabled ? CustomCrypto.Encrypt( '{}', ServerUserDB.passPhrase32Bit, ServerUserDB.iv ) : '{}';
//		fs.writeFileSync( storageAbsolutePath, content, 'utf8' );
		
		if (!FSUtils.ExistsSync(storageAbsolutePath))
		{
			await FSUtils.WriteFileAsync( storageAbsolutePath, ' {}' );
		}

		ServerUserDB.m_StorageName = storageAbsolutePath;
		console.log( `ServerUserDB: Location: ${storageAbsolutePath}` );
		return true;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async Save() : Promise<boolean>
	{
		console.log(`Storage:Saving storage ${ServerUserDB.m_StorageName}`);
		
		// Encapsulation
		const objectToSave : ITemplatedObject<IServerUserBaseProps> = {};
		for( const [userId, user] of ServerUserDB.m_Storage )
		{
			await Yieldable( () => objectToSave[user.id] = user );
		}

		// Object -> String
		let content = JSON.stringify( objectToSave, null, '\t' /*undefined*/ );

		// Encryption
		content = ServerUserDB.CustomCryptoEnabled ? CustomCrypto.Encrypt( content, ServerUserDB.passPhrase32Bit, ServerUserDB.iv ) : content;

		// Write to File
		const error = await FSUtils.WriteFileAsync( ServerUserDB.m_StorageName, content );
		console.log(`Storage:Storage ${ServerUserDB.m_StorageName} ${(!error ? 'saved':`not saved cause ${error}`)}`);
		return !error;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async Load() : Promise<boolean>
	{
		// Read from File
		const contentOrError = await FSUtils.ReadFileAsync( this.m_StorageName );
		if ( GenericUtils.IsTypeOf(contentOrError, Error) )
		{
			console.error( "ServerUserDB", 'Error reading userDB', contentOrError );
			return false;
		}

		// Buffer -> String
		let content = contentOrError.toString();

		// Decryption
		content = ServerUserDB.CustomCryptoEnabled ? CustomCrypto.Decrypt( content, ServerUserDB.passPhrase32Bit, ServerUserDB.iv ) : content

		// Parsing
		const parsed = GenericUtils.Parse<ITemplatedObject<Object>>( content );
		if ( GenericUtils.IsTypeOf(parsed, Error) )
		{
			console.error( "ServerUserDB", 'Error parsing userDB', parsed );
			return false;
		}

		// Usage
		for( const [userId, userData] of Object.entries(parsed) )
		{
			const user = ServerUser.Load(userData);
			ServerUserDB.m_Storage.set( userId, user );
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
	public static async GetUserByUsername( username: string ): Promise<ServerUser | null>
	{
		let userFound = null;
		for( const [userId, user] of ServerUserDB.m_Storage )
		{
			if (userFound) break;
			await Yieldable( () => userFound = user.username === username ? user : null);
		}
		return userFound;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async GetUserByToken(token: string): Promise<ServerUser | null>
	{
		let userFound = null;
		for( const [userId, user] of ServerUserDB.m_Storage )
		{
			if (userFound) break;
			await Yieldable( () => userFound = ( user.LoginToken === token ) ? user : null);
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
	public static RemoveUser( userId : string ) : boolean
	{
		return ServerUserDB.m_Storage.delete( userId );
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