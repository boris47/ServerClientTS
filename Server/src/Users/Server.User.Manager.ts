import { ServerUser } from "./Server.User";



export default class ServerUserManager
{
	private static LoggedInUsers = new Map<string, ServerUser>();

	
	///////////////////////////
	public static async RegisterUser( username: string, password: string ) : Promise<string>
	{
		const serverUser = ( await ServerUserManager.FindUserByusername(username) ) || new ServerUser( username, password );
		await serverUser.Login(serverUser.LoginData.Token);
		this.LoggedInUsers.set( serverUser.LoginData.Token, serverUser );
		return serverUser.LoginData.Token;
	}

	///////////////////////////
	public static async UserLogin( token: string ): Promise<boolean>
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
	public static async Logout(token: string) : Promise<void>
	{
		const serverUser = this.LoggedInUsers.get(token); // Array.from(this.LoggedInUsers.values()).find( u => u.ID === userId );
		if ( serverUser )
		{
			this.LoggedInUsers.delete(serverUser.LoginData.Token);
			await serverUser.Logout();
		}
	}


	///////////////////////////
	public static async FindUserByusername( username: string ): Promise<ServerUser | null>
	{
		return Array.from(this.LoggedInUsers.values()).find( u => u.Username === username ) || null;
	}


	///////////////////////////
	public static async IsUserLoggedIn(token: string) : Promise<boolean>
	{
		return this.LoggedInUsers.has(token);
	}


	///////////////////////////
	public static async HasAuthorizationFor( token: string, path: string ) : Promise<boolean>
	{
		return true; // TODO
	}
}