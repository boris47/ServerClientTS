
import * as http from 'http';
import * as ComUtils from '../../../Common/Utils/ComUtils';
import ServerUserManager from '../Users/Server.User.Manager';
import ServerResponsesProcessing from './Server.Responses.Processing';
import { HTTPCodes } from '../HTTP.Codes';

export default class ServerResponseUser
{
	/////////////////////////////////////////////////////////////////////////////////////////
	public static async UserRegister(request: http.IncomingMessage, response: http.ServerResponse): Promise<ComUtils.IServerResponseResult>
	{
		const username = request.headers.username as string;
		const password = request.headers.password as string;
		if ( typeof username !== 'string' || typeof password !== 'string')
		{
			ServerResponsesProcessing.EndResponseWithError(response, HTTPCodes[400], 400); // Bad Request
			return ComUtils.ResolveWithError('[REGISTER]', 'User registration failed because malformed username or password');
		}

		const token = await ServerUserManager.RegisterUser(username, password);
		if (!token)
		{
			ServerResponsesProcessing.EndResponseWithError(response, HTTPCodes[401], 401); // Unauthorized
			return ComUtils.ResolveWithError('[REGISTER]', 'User cannot have registration completed');
		}

		ServerResponsesProcessing.EndResponseWithGoodResult(response, token);
		return ComUtils.ResolveWithGoodResult();
	};

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async UserLogin(request: http.IncomingMessage, response: http.ServerResponse): Promise<ComUtils.IServerResponseResult>
	{
		const username = request.headers.username as string;
		const password = request.headers.password as string;
		if ( typeof username !== 'string' || typeof password !== 'string')
		{
			ServerResponsesProcessing.EndResponseWithError(response, HTTPCodes[400], 400); // Bad Request
			return ComUtils.ResolveWithError('[LOGIN]', 'User login failed because malformed username or password');
		}

		const token = await ServerUserManager.UserLogin(username, password);
		if ( !token )
		{
			ServerResponsesProcessing.EndResponseWithError(response, HTTPCodes[404], 404); // Not Found
			return ComUtils.ResolveWithError('[LOGIN]', 'User not exists');
		}
		ServerResponsesProcessing.EndResponseWithGoodResult(response, token);
		return ComUtils.ResolveWithGoodResult();
	};

	/////////////////////////////////////////////////////////////////////////////////////////
/*	public static async UserLoginByToken(request: http.IncomingMessage, response: http.ServerResponse): Promise<ComUtils.IServerResponseResult>
	{
		const token = request.headers.token as string;
		const bLoggedIn = await ServerUserManager.UserLoginByToken(token);
		if ( !bLoggedIn )
		{
			const err = `Login required`;
			ServerResponsesProcessing.EndResponseWithError(response, err, 401);
			return ComUtils.ResolveWithError('[LOGIN]', err);
		}

		ServerResponsesProcessing.EndResponseWithGoodResult(response);
		return ComUtils.ResolveWithGoodResult();
	}*/

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async UserLogout(request: http.IncomingMessage, response: http.ServerResponse): Promise<ComUtils.IServerResponseResult>
	{
		const token = request.headers.token as string;
		const result = await ServerUserManager.UserLogout(token);
		if (!result)
		{
			ServerResponsesProcessing.EndResponseWithError(response, HTTPCodes[401], 401); // Unauthorized
			return ComUtils.ResolveWithError('[LOGOUT]', `User with token '${token}' not found`);
		}

		ServerResponsesProcessing.EndResponseWithGoodResult(response);
		return ComUtils.ResolveWithGoodResult();
	};
}