import { ServerUser } from "./Server.User";
import ServerUserDB from "./Server.User.DB";
import { Yieldable } from "../../../Common/Utils/GenericUtils";



export default class ServerUserRuntimeManager
{
	/**
	 * @Key User Login Token
	 * @Value User
	 */
	private static readonly LoggedInUsersMappedByAccessToken = new Map<string, ServerUser>();

	/**
	 * @Key Username
	 * @Value User
	 */
	private static readonly LoggedInUserMappedByUserName = new Map<string, ServerUser>();

	/////////////////////////////////////////////////////////////////////////////////////////
	private static async FindUser( username: string ): Promise<ServerUser | null>
	{
		const queriesResult = await Promise.all(
			[
				// Search for already logged in user
				ServerUserRuntimeManager.FindLoggedInUserByUsername(username),

				// Search into user database
				ServerUserDB.GetUserByUsername(username)
			]
		);
		return queriesResult.find(r => !!r) || null;
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public static async RegisterUser(username: string, password: string): Promise<string | null>
	{
		// If aleady registeres or logged return the current instance
	//	const { username: encryptedUsername, password: encryptedPassword } = ServerUser.EncryptData( username, password );
		const serverUser = await ServerUserRuntimeManager.FindUser(username);
		if (serverUser && serverUser.IsPassword(password))
		{
			return serverUser.id;
		}

		const newUser = new ServerUser(username, password);
		const bResult = ServerUserDB.AddUser(newUser, false);
		await ServerUserDB.Save();
		return bResult ? newUser.id : null;
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	/**
	 * @param username The username
	 * @param password The password
	 * @returns the access token
	 */
	public static async UserLogin(username: string, password: string): Promise<string | null>
	{
//		const { username: encryptedUsername, password: encryptedPassword } = ServerUser.EncryptData( username, password );
		const serverUser = await ServerUserRuntimeManager.FindUser(username);
		if (serverUser && serverUser.IsPassword(password))
		{
			serverUser.Login(serverUser.LoginToken);
			this.LoggedInUsersMappedByAccessToken.set(serverUser.LoginToken, serverUser);
			this.LoggedInUserMappedByUserName.set( username, serverUser );
		}
		return serverUser?.LoginToken || null;
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public static async UserLoginByToken(token: string): Promise<boolean>
	{
		const serverUser = await ServerUserDB.GetUserByToken(token);
		if (serverUser)
		{
			serverUser.Login(token);
			this.LoggedInUsersMappedByAccessToken.set(token, serverUser);
			this.LoggedInUserMappedByUserName.set( serverUser.username, serverUser );
		}
		return !!serverUser;
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public static async UserLogout(token: string): Promise<boolean>
	{
		const serverUser = this.LoggedInUsersMappedByAccessToken.get(token);
		if (serverUser)
		{
			this.LoggedInUsersMappedByAccessToken.delete(serverUser.LoginToken);
			this.LoggedInUserMappedByUserName.delete( serverUser.username );
			await serverUser.Logout();
		}
		return !!serverUser;
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public static FindLoggedInUserByUsername(username: string): ServerUser | null
	{
		return this.LoggedInUserMappedByUserName.get(username) || null;
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public static FindLoggedInUserByToken(token: string): ServerUser | null
	{
		return this.LoggedInUsersMappedByAccessToken.get(token) || null;
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public static async HasAuthorizationFor(token: string, path: string): Promise<boolean>
	{
		return true; // TODO
	}
}