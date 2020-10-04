
import * as http from 'http';
import { IClientRequestInternalOptions, ClientRequestsProcessing } from "./client.Requests.Processing";


export default class ClientRequestStorage
{
	/////////////////////////////////////////////////////////////////////////////////////////
	public static async Storage_Get( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions )
	{
		return ClientRequestsProcessing.HandleDownload( options, clientRequestInternalOptions );
	};

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async Storage_Put( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions )
	{
		const { Value } = clientRequestInternalOptions
		const buffered: Buffer = Buffer.isBuffer(Value) ? Value : Buffer.from(Value);
		clientRequestInternalOptions.Headers['content-length'] = buffered.length.toString();
		clientRequestInternalOptions.Value = buffered;
		return ClientRequestsProcessing.HandleUpload( options, clientRequestInternalOptions );
	};

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async Storage_Delete( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions )
	{
		return ClientRequestsProcessing.SimpleRequest( options, clientRequestInternalOptions );
	};
}