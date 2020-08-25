
import * as http from 'http';
import { IClientRequestInternalOptions, ClientRequestsProcessing } from "./client.Requests.Processing";


export default class ClientRequestUser
{
	/////////////////////////////////////////////////////////////////////////////////////////
	public static async User_Register( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions )
	{
		return ClientRequestsProcessing.MakeRequest( options, clientRequestInternalOptions );
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public static async User_Login( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions )
	{
		return ClientRequestsProcessing.MakeRequest( options, clientRequestInternalOptions );
	};


	/////////////////////////////////////////////////////////////////////////////////////////
	public static async User_Logout( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions )
	{
		return ClientRequestsProcessing.MakeRequest( options, clientRequestInternalOptions );
	};
}