import { ServerUser } from "./Server.User";
import ServerUserDB from "./Server.User.DB";



export default class ServerUserManager
{
	private static LoggedInUsers = new Map<string, ServerUser>();


	public static async RegisterUser( username: string, password: string ): Promise<string | null>
	{
		const { username: encryptedUsername, password: encriptedPassword, id } = ServerUser.EncryptData( username, password );
		const newuser = new ServerUser( encryptedUsername, encriptedPassword, id );
		const bResult = await ServerUserDB.AddUser( newuser, false );
		await ServerUserDB.Save();
		return bResult ? newuser.id : null;
	}
	
	///////////////////////////
	/**
	 * @param username The username
	 * @param password The passerwor
	 * @returns the access token
	 */
	public static async UserLogin( username: string, password: string ) : Promise<string | null>
	{
		const { username: encryptedUsername, password: encryptedPassword } = ServerUser.EncryptData( username, password );
		const serverUser = ( await ServerUserManager.FindLoggedInUserByUsername(encryptedUsername) ) || ( await ServerUserDB.GetUserByUsername(encryptedUsername) );
		if ( serverUser && serverUser.IsPassword(encryptedPassword) )
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
		const serverUser = this.LoggedInUsers.get(token); // Array.from(this.LoggedInUsers.values()).find( u => u.ID === userId );
		if ( serverUser )
		{
			this.LoggedInUsers.delete(serverUser.LoginData.Token);
			await serverUser.Logout();
		}
	}


	///////////////////////////
	public static async FindLoggedInUserByUsername(username: string): Promise<ServerUser | null>
	{
		return Array.from(this.LoggedInUsers.values()).find( u => u.username === username ) || null;
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