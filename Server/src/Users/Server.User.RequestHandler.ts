
import * as http from 'http';

import * as ComUtils from '../../../Common/Utils/ComUtils';
import ServerResponsesProcessing from '../Responses/Server.Responses.Processing';
import { HTTPCodes } from '../HTTP.Codes';
import ServerUserManager from './Server.User.Manager';


export default class ServerUserRequestHandler
{
	public static async CheckUserAuths( token: string, path: string, request: http.IncomingMessage, response: http.ServerResponse ) : Promise<ComUtils.IServerResponseResult>
	{
		// Login is OK?
		if ( token )
		{
			if ( !ServerUserManager.IsUserLoggedIn(token) )
			{
				ServerResponsesProcessing.EndResponseWithError(response, 'Login required', 401 );
				return ComUtils.ResolveWithError('Login Requested', HTTPCodes[401]);
			}
			else	// Redirect to login
			{
				
			}
		}

		
		// Auth is OK?
		if ( !ServerUserManager.HasAuthorizationFor(token, path) )
		{
			ServerResponsesProcessing.EndResponseWithError(response, HTTPCodes[401], 401 );
			return ComUtils.ResolveWithError('PermissionError', HTTPCodes[401]);
		}

		return ComUtils.ResolveWithGoodResult();
	}
}
