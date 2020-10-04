
import * as http from 'http';
import * as ComUtils from '../../../Common/Utils/ComUtils';
import ServerUserRuntimeManager from '../Users/Server.User.RuntimeManager';
import ServerResponsesProcessing from './Server.Responses.Processing';
import { HTTPCodes } from '../HTTP.Codes';
import { EHeaders } from '../../../Common/Interfaces';

export default class ServerResponseUser
{
	/////////////////////////////////////////////////////////////////////////////////////////
	public static async UserRegister(request: http.IncomingMessage, response: http.ServerResponse): Promise<Buffer | Error>
	{
		const username = request.headers[EHeaders.USERNAME] as string;
		const password = request.headers[EHeaders.PASSWORD] as string;
		if ( typeof username !== 'string' || typeof password !== 'string')
		{
			ServerResponsesProcessing.EndResponseWithError(response, HTTPCodes[400], 400); // Bad Request
			return ComUtils.ResolveWithError('[REGISTER]', 'User registration failed because malformed username or password');
		}

		const token = await ServerUserRuntimeManager.RegisterUser(username.toLowerCase(), password);
		if (!token)
		{
			ServerResponsesProcessing.EndResponseWithError(response, HTTPCodes[401], 401); // Unauthorized
			return ComUtils.ResolveWithError('[REGISTER]', 'User cannot have registration completed');
		}

		ServerResponsesProcessing.EndResponseWithGoodResult(response, token);
		return ComUtils.ResolveWithGoodResult();
	};

	
	/////////////////////////////////////////////////////////////////////////////////////////
	public static async UserLogin(request: http.IncomingMessage, response: http.ServerResponse): Promise<Buffer | Error>
	{
		// Access requested by token
		if (request.headers[EHeaders.TOKEN])
		{
			const token = request.headers[EHeaders.TOKEN] as string;
			const bResult = await ServerUserRuntimeManager.UserLoginByToken(token);
			if (!bResult)
			{
				ServerResponsesProcessing.EndResponseWithError(response, HTTPCodes[404], 404); // Not Found
				return ComUtils.ResolveWithError('[LOGIN]', `token ${token} refused`);
			}
			ServerResponsesProcessing.EndResponseWithGoodResult(response, token);
			return ComUtils.ResolveWithGoodResult();
		}

		// Normal access
		const username = request.headers[EHeaders.USERNAME] as string;
		const password = request.headers[EHeaders.PASSWORD] as string;
		if ( typeof username !== 'string' || typeof password !== 'string')
		{
			ServerResponsesProcessing.EndResponseWithError(response, HTTPCodes[400], 400); // Bad Request
			return ComUtils.ResolveWithError('[LOGIN]', 'User login failed because malformed username or password');
		}

		const token = await ServerUserRuntimeManager.UserLogin(username.toLowerCase(), password);
		if ( !token )
		{
			ServerResponsesProcessing.EndResponseWithError(response, HTTPCodes[404], 404); // Not Found
			return ComUtils.ResolveWithError('[LOGIN]', 'User not exists');
		}

		ServerResponsesProcessing.EndResponseWithGoodResult(response, token);
		return ComUtils.ResolveWithGoodResult();
	};


	/////////////////////////////////////////////////////////////////////////////////////////
	public static async UserLogout(request: http.IncomingMessage, response: http.ServerResponse): Promise<Buffer | Error>
	{
		const token = request.headers[EHeaders.TOKEN] as string;
		const result = await ServerUserRuntimeManager.UserLogout(token);
		if (!result)
		{
			ServerResponsesProcessing.EndResponseWithError(response, HTTPCodes[401], 401); // Unauthorized
			return ComUtils.ResolveWithError('[LOGOUT]', `User with token '${token}' not found`);
		}

		ServerResponsesProcessing.EndResponseWithGoodResult(response);
		return ComUtils.ResolveWithGoodResult();
	};
}