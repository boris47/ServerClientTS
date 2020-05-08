
	import {
		RequestServerPing,
//		RequestFileUpload,
	//	RequestFileDownload,
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
	/*	.then( ( bCanContinue : boolean ) =>
		{
			return bCanContinue ? RequestFileUpload( 'E:/temppp/SZ_Bug_SS_158.7z.002' ) : Promise.reject(false);
		})
	*/		
	/*	.then( ( bCanContinue : boolean ) =>
		{
			return bCanContinue ? RequestFileDownload( './Server.js' ) : Promise.reject(false);
		})
	*/
	/*	.then( ( bCanContinue : boolean ) =>
		{
			return bCanContinue ? RequestPutData( 'MyDataName', '123' ) : Promise.reject(false);
		})
	*/
	/*	.then( ( bCanContinue : boolean ) =>
		{
			return bCanContinue ? RequestGetData<string>( 'MyDataName' ) : Promise.reject(null);
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




