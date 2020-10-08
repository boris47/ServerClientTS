import { ICP_RendererComs } from "../icpRendererComs";
import { EComunicationsChannels } from "../../icpComs";
import AppRouter from "../appRouter";


export default class LoginManager
{
	private static isLogged: boolean = false;
	public static IsLoggedIn(): boolean { return LoginManager.isLogged; }
	
	private static token: string = undefined;
	public static get Token(): string { return LoginManager.token; }


	/////////////////////////////////////////////////////////////////////////////////////////
	public static async TryAutoLogin(): Promise<boolean>
	{
		const token = await ICP_RendererComs.Request(EComunicationsChannels.STORAGE_GET, null, 'accessToken');
		if ( !token )
		{
			console.log('No token found for autologin');
			return false;
		}

		console.log("TRING AUTOLOGIN WITH TOKEN", token.toString());

		let bResult = true;
		const reqResult = await ICP_RendererComs.Request(EComunicationsChannels.REQ_USER_LOGIN_TOKEN, null, token.toString());
		if (LoginManager.isLogged = Buffer.isBuffer(reqResult))
		{
			LoginManager.token = reqResult.toString();
	//		AppRouter.NavigateTo('testPage');
		}
		else
		{
			bResult = false;
			console.error( `AutoLogin Failed!!\n${reqResult}` );
		}
		return bResult;
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public static async Trylogin( username: string, password: string ): Promise<boolean>
	{
		let bResult = true;
		const reqResult = await ICP_RendererComs.Request(EComunicationsChannels.REQ_USER_LOGIN, null, username, password);
		if (LoginManager.isLogged = Buffer.isBuffer(reqResult))
		{
			LoginManager.token = reqResult.toString();
			console.log('TOKEN', LoginManager.token);
			AppRouter.NavigateTo('testPage');
		}
		else
		{
			bResult = false;
			console.error( `Login Failed!!\n${reqResult}` );
		}
		return bResult;
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public static async TryLogout(): Promise<boolean>
	{
		let bResult = true;
		if (!LoginManager.token)
		{
			return bResult;
		}
		const reqResult = await ICP_RendererComs.Request(EComunicationsChannels.REQ_USER_LOGOUT, null, LoginManager.token);
		if (Buffer.isBuffer(reqResult))
		{
			LoginManager.isLogged = false;
			console.log('TOKEN', reqResult.toString());
			AppRouter.NavigateTo('loginPage');
		}
		else
		{
			bResult = false;
			console.error( `Logout Failed!!\n${reqResult}` );

			// Whatever is the reason the user must reach the login page
			AppRouter.NavigateTo('loginPage');
		}
		return bResult;
	}
}
