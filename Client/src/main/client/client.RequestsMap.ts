
import * as http from 'http';

import { IClientRequestResult } from '../../../../Common/Interfaces';
import { ClientRequests, IClientRequestInternalOptions } from './Client.Requests';

export interface IRequestsMethods
{
	[key:string] :( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) => Promise<IClientRequestResult>; 
	post? 		: ( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) => Promise<IClientRequestResult>;
	get? 		: ( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) => Promise<IClientRequestResult>;
	put? 		: ( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) => Promise<IClientRequestResult>;
	patch? 		: ( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) => Promise<IClientRequestResult>;
	delete? 	: ( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) => Promise<IClientRequestResult>;
}

export const RequestsMap : ServerResponseMap = {

	'/ping': <IRequestsMethods>
	{
		get : ( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) =>
		{
			return ClientRequests.Request_GET( options, clientRequestInternalOptions );
		}
	},

	'/upload' : <IRequestsMethods>
	{
		put: ( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) =>
		{
			return ClientRequests.UploadFile( options, clientRequestInternalOptions );
		}
	},

	'/download' : <IRequestsMethods>
	{
		get : ( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) =>
		{
			return ClientRequests.DownloadFile( options, clientRequestInternalOptions );
		}
	},

	'/storage': <IRequestsMethods>
	{
		get: ( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) =>
		{
			return ClientRequests.Request_GET( options, clientRequestInternalOptions );
		},

		put: ( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) =>
		{
			return ClientRequests.Request_PUT( options, clientRequestInternalOptions );
		},

		delete: ( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) =>
		{
			return ClientRequests.Request_PUT( options, clientRequestInternalOptions );
		},
	},

}




interface ServerResponseMap
{
	[key:string] : IRequestsMethods
}