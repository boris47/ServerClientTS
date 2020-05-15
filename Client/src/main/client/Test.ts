
	import {
		RequestServerPing,
	//	RequestStorageList,
	//	RequestResourceUpload,
	//	RequestResourceDownload,
	//	RequestGetData,
	//	RequestPutData
	} from "./client.RequestProcessor";

	import { InstallRequestsProcessor } from "./client.RequestProcessor";

//	import * as path from 'path';

async function Main()
{
	await InstallRequestsProcessor();
	{
		RequestServerPing()
	/*	.then( ( result : Buffer | Error ) =>
		{
			return Buffer.isBuffer(result) ? RequestStorageList() : Promise.reject(result);
		})
	*/
	/*	.then( ( result : Buffer | Error ) =>
		{
			return Buffer.isBuffer(result) ? RequestResourceUpload( './exampleFile' ) : Promise.reject(result);
		})
	*/
	/*	.then( ( result : Buffer | Error ) =>
		{
			return Buffer.isBuffer(result) ? RequestResourceDownload( 'exampleFile', 'E:/SourceTree/ServerClientTS/Client/Downloads' ) : Promise.reject(result);
		})
	*/
	/*	.then( ( result : Buffer | Error ) =>
		{
			return Buffer.isBuffer(result) ? RequestPutData( 'MyDataName', '123' ) : Promise.reject(result);
		})
	*/
	/*	.then( ( result : Buffer | Error ) =>
		{
			return Buffer.isBuffer(result) ? RequestGetData( 'kedyy' ) : Promise.reject(result);
		})
	*/
	/*	.then( ( value: string | null ) =>
		{
			console.log( "Value", value?.toString() );
		})
	*/
	/*	.catch( reason => console.error(reason) );
	*/	
	}
}

Main();




