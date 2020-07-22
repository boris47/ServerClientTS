import { ServerUser } from "./Server.User";
import ServerUserDB from "./Server.User.DB";
import { Yieldable } from "../../../Common/Utils/GenericUtils";



export default class ServerUserManager
{
	private static LoggedInUsers = new Map<string, ServerUser>();


	public static async RegisterUser( username: string, password: string ): Promise<string | null>
	{
		// If aleady registeres or logged return the current instance
	//	const { username: encryptedUsername, password: encryptedPassword } = ServerUser.EncryptData( username, password );
		const serverUser = ( await ServerUserManager.FindLoggedInUserByUsername(username) ) || ( await ServerUserDB.GetUserByUsername(username) );
		if ( serverUser && serverUser.IsPassword(password) )
		{
			return serverUser.id;
		}
	
		const newuser = new ServerUser( username, password );
		const bResult = ServerUserDB.AddUser( newuser, false );
		await ServerUserDB.Save();
		return bResult ? newuser.id : null;
	}
	
	///////////////////////////
	/**
	 * @param username The username
	 * @param password The password
	 * @returns the access token
	 */
	public static async UserLogin( username: string, password: string ) : Promise<string | null>
	{
//		const { username: encryptedUsername, password: encryptedPassword } = ServerUser.EncryptData( username, password );
		const serverUser = ( await ServerUserManager.FindLoggedInUserByUsername(username) ) || ( await ServerUserDB.GetUserByUsername(username) );
		if ( serverUser && serverUser.IsPassword(password) )
		{
			await serverUser.Login(serverUser.LoginData.Token);
//			console.warn( 'token', serverUser.LoginData.Token );
		}
		return serverUser?.LoginData.Token || null;
	}

	///////////////////////////
	public static async UserLoginByToken( token: string ): Promise<boolean>
	{
		const serverUser = await ServerUser.GetUserByToken(token);
		if (serverUser)
		{
			serverUser.Login(token);
			this.LoggedInUsers.set( token, serverUser );
		}
		return !!serverUser;
	}

	///////////////////////////
	public static async UserLogout(token: string) : Promise<void>
	{
		const serverUser = this.LoggedInUsers.get(token);
		if ( serverUser )
		{
			this.LoggedInUsers.delete(serverUser.LoginData.Token);
			await serverUser.Logout();
		}
	}

	///////////////////////////
	public static async FindLoggedInUserByUsername(username: string): Promise<ServerUser | null>
	{
		let userFound = null;
		for( const [userId, user] of this.LoggedInUsers )
		{
			if (userFound) break;
			await Yieldable( () => userFound = user.username === username ? user : null);
		}
		return userFound;
	}

	///////////////////////////
	public static async FindLoggedInUserByToken(token: string) : Promise<ServerUser | null>
	{
		return this.LoggedInUsers.get(token) || null;
	}


	///////////////////////////
	public static async HasAuthorizationFor( token: string, path: string ) : Promise<boolean>
	{
		return true; // TODO
	}
}