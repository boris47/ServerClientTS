
import * as http from 'http';

import * as ComUtils from '../../../Common/Utils/ComUtils';
import ServerResponsesProcessing from '../Responses/Server.Responses.Processing';
import { HTTPCodes } from '../HTTP.Codes';
import ServerUserManager from './Server.User.Manager';


export default class ServerUserRequestHandler
{
	public static async CheckUserAuths(path: string, requiresAuth: boolean, request: http.IncomingMessage, response: http.ServerResponse): Promise<ComUtils.IServerResponseResult>
	{
		// Login is OK?
		const token = request.headers.token as string;
		if (requiresAuth && (!token || !ServerUserManager.FindLoggedInUserByToken(token)))
		{
			response.setHeader('WWW-Authenticate', 'Basic');
			ServerResponsesProcessing.EndResponseWithError(response, 'Login required', 401);
			return ComUtils.ResolveWithError('Login Requested', HTTPCodes[401]);
		}

		// Auth is OK?
		if (token && !ServerUserManager.HasAuthorizationFor(token, path))
		{
			response.setHeader('WWW-Authenticate', 'Basic');
			ServerResponsesProcessing.EndResponseWithError(response, HTTPCodes[401], 401);
			return ComUtils.ResolveWithError('PermissionError', HTTPCodes[401]);
		}

		return ComUtils.ResolveWithGoodResult();
	}
}
