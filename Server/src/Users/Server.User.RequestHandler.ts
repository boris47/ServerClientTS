
import * as http from 'http';

import ServerResponsesProcessing from '../Responses/Server.Responses.Processing';
import ServerUserRuntimeManager from './Server.User.RuntimeManager';
import * as ComUtils from '../../../Common/Utils/ComUtils';
import { EHeaders } from '../../../Common/Interfaces';
import { HTTPCodes } from '../HTTP.Codes';

export default class ServerUserRequestHandler
{
	public static async CheckUserAuths(path: string, requiresAuth: boolean, request: http.IncomingMessage, response: http.ServerResponse): Promise<ComUtils.IServerResponseResult>
	{
		// Login is OK?
		const token = request.headers[EHeaders.TOKEN] as string;
		if (requiresAuth && (!token || !await ServerUserRuntimeManager.FindLoggedInUserByToken(token)))
		{
			response.setHeader('WWW-Authenticate', 'Basic');
			ServerResponsesProcessing.EndResponseWithError(response, 'Login required', 401);
			return ComUtils.ResolveWithError('Login Requested', HTTPCodes[401]);
		}

		// Auth is OK?
		if (token && !await ServerUserRuntimeManager.HasAuthorizationFor(token, path))
		{
			response.setHeader('WWW-Authenticate', 'Basic');
			ServerResponsesProcessing.EndResponseWithError(response, HTTPCodes[401], 401);
			return ComUtils.ResolveWithError('PermissionError', HTTPCodes[401]);
		}

		return ComUtils.ResolveWithGoodResult();
	}
}
