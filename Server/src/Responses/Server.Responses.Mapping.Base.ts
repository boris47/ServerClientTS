
import * as http from 'http';
import * as ComUtils from '../../../Common/Utils/ComUtils';
import { ITemplatedObject } from '../../../Common/Utils/GenericUtils';

import ServerResponseStorage from './Server.Responses.Mapping.Storage';
import ServerResponseUser from './Server.Responses.Mapping.User';
import ServerResponseResources from './Server.Responses.Mapping.Resources';


/** https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods */
export interface IResponseMethods
{
	[key: string]: ( (request: http.IncomingMessage, response: http.ServerResponse) => Promise<ComUtils.IServerResponseResult>);

	/** The GET method requests a representation of the specified resource. Requests using GET should only retrieve data.
	 * 
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/GET
	 */
	get?: (request: http.IncomingMessage, response: http.ServerResponse) => Promise<ComUtils.IServerResponseResult>;
	/** The HEAD method asks for a response identical to that of a GET request, but without the response body.
	 * 
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/HEAD
	 */
	head?: (request: http.IncomingMessage, response: http.ServerResponse) => Promise<ComUtils.IServerResponseResult>;
	/** The POST method is used to submit an entity to the specified resource, often causing a change in state or side effects on the server.
	 * 
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST
	 */
	post?: (request: http.IncomingMessage, response: http.ServerResponse) => Promise<ComUtils.IServerResponseResult>;
	/** The PUT method replaces all current representations of the target resource with the request payload.
	 * 
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/PUT
	*/
	put?: (request: http.IncomingMessage, response: http.ServerResponse) => Promise<ComUtils.IServerResponseResult>;
	/** The DELETE method deletes the specified resource.
	 * 
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/DELETE
	*/
	delete?: (request: http.IncomingMessage, response: http.ServerResponse) => Promise<ComUtils.IServerResponseResult>;
	/** The CONNECT method establishes a tunnel to the server identified by the target resource.
	 * 
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/CONNECT
	*/
	connect?: (request: http.IncomingMessage, response: http.ServerResponse) => Promise<ComUtils.IServerResponseResult>;
	/** The OPTIONS method is used to describe the communication options for the target resource.
	 * 
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/OPTIONS
	*/
	options?: (request: http.IncomingMessage, response: http.ServerResponse) => Promise<ComUtils.IServerResponseResult>;
	/** The TRACE method performs a message loop-back test along the path to the target resource.
	 * 
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/TRACE
	*/
	trace?: (request: http.IncomingMessage, response: http.ServerResponse) => Promise<ComUtils.IServerResponseResult>;
	/** The PATCH method is used to apply partial modifications to a resource.
	 * 
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/PATCH
	*/
	patch?: (request: http.IncomingMessage, response: http.ServerResponse) => Promise<ComUtils.IServerResponseResult>;
}

export interface IResponsesMapItem
{
	requiresAuth: boolean;
	responseMethods : IResponseMethods
}


/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////

// TODO Auto registration by modules
export const ResponsesMap: ITemplatedObject<IResponsesMapItem> =
{
	'/user':
	{
		requiresAuth: false,
		responseMethods: { get: ServerResponseUser.UserLogin, put: ServerResponseUser.UserRegister, post: ServerResponseUser.UserLogout }
	},

	'/resource':
	{
		requiresAuth: true,
		responseMethods: { get: ServerResponseResources.ServerToClient, put:ServerResponseResources.ClientToServer }
	},

	'/storage':
	{
		requiresAuth: true,
		responseMethods: { get: ServerResponseStorage.Get, put: ServerResponseStorage.Add, delete: ServerResponseStorage.Delete }
	}
};