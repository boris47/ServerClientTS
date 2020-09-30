
import * as http from 'http';

import { EMappedPaths } from '../../../../Common/Interfaces';
import { IClientRequestInternalOptions } from './client.Requests.Processing';
import { ITemplatedObject } from '../../../../Common/Utils/GenericUtils';
import ClientRequestUser from './client.Requests.User';
import ClientRequestResources from './client.Requests.Resources';
import ClientRequestStorage from './client.Requests.Storage';


export interface IRequestsMethods
{
	[key:string] :( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) => Promise<Error | Buffer>; 
	post? 		: ( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) => Promise<Error | Buffer>;
	get? 		: ( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) => Promise<Error | Buffer>;
	put? 		: ( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) => Promise<Error | Buffer>;
	patch? 		: ( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) => Promise<Error | Buffer>;
	delete? 	: ( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions ) => Promise<Error | Buffer>;
}


export const RequestsMap : ITemplatedObject<IRequestsMethods> =
{
	[EMappedPaths.USER]:
	{
		get: ClientRequestUser.User_Login, put: ClientRequestUser.User_Register, post: ClientRequestUser.User_Logout
	},

	[EMappedPaths.RESOURCE]:
	{
		get: ClientRequestResources.DownloadResource, put: ClientRequestResources.UploadResource
	},

	[EMappedPaths.STORAGE]:
	{
		get: ClientRequestStorage.Storage_Get, put: ClientRequestStorage.Storage_Put, delete: ClientRequestStorage.Storage_Delete,
	},
};