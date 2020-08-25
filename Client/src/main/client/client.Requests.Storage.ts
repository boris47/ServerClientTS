
import * as http from 'http';
import { IClientRequestInternalOptions, ClientRequestsProcessing } from "./client.Requests.Processing";


export default class ClientRequestStorage
{
	/////////////////////////////////////////////////////////////////////////////////////////
	public static async Storage_Get( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions )
	{
		return ClientRequestsProcessing.MakeRequest( options, clientRequestInternalOptions );
	};

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async Storage_Put( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions )
	{
		return ClientRequestsProcessing.MakeRequest( options, clientRequestInternalOptions );
	};

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async Storage_Delete( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions )
	{
		return ClientRequestsProcessing.MakeRequest( options, clientRequestInternalOptions );
	};
}