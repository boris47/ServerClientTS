
import * as http from 'http';
import { ITemplatedObject } from '../../../Common/Utils/GenericUtils';
import { EMappedPaths } from '../../../Common/Interfaces';

import ServerResponsesProcessing from './Server.Responses.Processing';
import ServerResponseUser from './Server.Responses.User';
import ServerResponseResources from './Server.Responses.Resources';
import ServerResponseStorage from './Server.Responses.Storage';


/** https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods */
export interface IResponseMethods
{
	[key: string]: ( (request: http.IncomingMessage, response: http.ServerResponse) => Promise<Buffer | Error>);

	/** The GET method requests a representation of the specified resource. Requests using GET should only retrieve data.
	 * 
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/GET
	 */
	get?: (request: http.IncomingMessage, response: http.ServerResponse) => Promise<Buffer | Error>;
	/** The HEAD method asks for a response identical to that of a GET request, but without the response body.
	 * 
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/HEAD
	 */
	head?: (request: http.IncomingMessage, response: http.ServerResponse) => Promise<Buffer | Error>;
	/** The POST method is used to submit an entity to the specified resource, often causing a change in state or side effects on the server.
	 * 
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST
	 */
	post?: (request: http.IncomingMessage, response: http.ServerResponse) => Promise<Buffer | Error>;
	/** The PUT method replaces all current representations of the target resource with the request payload.
	 * 
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/PUT
	*/
	put?: (request: http.IncomingMessage, response: http.ServerResponse) => Promise<Buffer | Error>;
	/** The DELETE method deletes the specified resource.
	 * 
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/DELETE
	*/
	delete?: (request: http.IncomingMessage, response: http.ServerResponse) => Promise<Buffer | Error>;
	/** The CONNECT method establishes a tunnel to the server identified by the target resource.
	 * 
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/CONNECT
	*/
	connect?: (request: http.IncomingMessage, response: http.ServerResponse) => Promise<Buffer | Error>;
	/** The OPTIONS method is used to describe the communication options for the target resource.
	 * 
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/OPTIONS
	*/
	options?: (request: http.IncomingMessage, response: http.ServerResponse) => Promise<Buffer | Error>;
	/** The TRACE method performs a message loop-back test along the path to the target resource.
	 * 
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/TRACE
	*/
	trace?: (request: http.IncomingMessage, response: http.ServerResponse) => Promise<Buffer | Error>;
	/** The PATCH method is used to apply partial modifications to a resource.
	 * 
	 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/PATCH
	*/
	patch?: (request: http.IncomingMessage, response: http.ServerResponse) => Promise<Buffer | Error>;
}

export interface IResponsesMapItem
{
	requiresAuth: boolean;
	responseMethods : IResponseMethods
}


/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////

export const ResponsesMap: ITemplatedObject<IResponsesMapItem> =
{
	[EMappedPaths.USER]:
	{
		requiresAuth: false,
		responseMethods: { get: ServerResponseUser.UserLogin, put: ServerResponseUser.UserRegister, post: ServerResponseUser.UserLogout }
	},

	[EMappedPaths.RESOURCE]:
	{
		requiresAuth: true,
		responseMethods: { get: ServerResponseResources.Resources_Upload, put:ServerResponseResources.Resources_Download }
	},

	[EMappedPaths.STORAGE]:
	{
		requiresAuth: true,
		responseMethods: { get: ServerResponseStorage.Storage_Get, put: ServerResponseStorage.Storage_Add, delete: ServerResponseStorage.Storage_Delete }
	}
};