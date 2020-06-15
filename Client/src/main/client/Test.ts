
	import {
		RequestServerPing,
		RequestStorageList,
		RequestResourceUpload,
		RequestResourceDownload,
		RequestGetData,
		RequestPutData
	} from "./client";

	import { InstallRequestsProcessor } from "./client";
import { ComProgress, IComProgress } from "../../../../Common/Utils/ComUtils";
import { UniqueID } from "../../../../Common/Utils/GenericUtils";

//	import * as path from 'path';

async function Main()
{
	await InstallRequestsProcessor();
	{
		RequestServerPing()
		.then( ( result : Buffer | Error ) =>
		{
			return Buffer.isBuffer(result) ? RequestStorageList() : Promise.reject(result);
		})
	
		.then( ( result : Buffer | Error ) =>
		{
			const progressInterface : IComProgress = 
			{
				id : UniqueID.Generate(),
				value : 0
			}
			const comProgress = new ComProgress( progressInterface, ( value: number ) => {  } );
			return Buffer.isBuffer(result) ? RequestResourceUpload( './Tests/RequestResourceUpload/GPU-Z.2.25.0.exe', comProgress ) : Promise.reject(result);
		})
	
		.then( ( result : Buffer | Error ) =>
		{
			const progressInterface : IComProgress = 
			{
				id : UniqueID.Generate(),
				value : 0
			}
			const comProgress = new ComProgress( progressInterface, ( value: number ) => {} );
			return Buffer.isBuffer(result) ? RequestResourceDownload( 'GPU-Z.2.25.0.exe', 'E:/SourceTree/ServerClientTS/Client/Tests/RequestResourceDownload', comProgress ) : Promise.reject(result);
		})
	
		.then( ( result : Buffer | Error ) =>
		{
			return Buffer.isBuffer(result) ? RequestPutData( 'MyDataName', '123' ) : Promise.reject(result);
		})
	
		.then( ( result : Buffer | Error ) =>
		{
			return Buffer.isBuffer(result) ? RequestGetData( 'kedyy' ) : Promise.reject(result);
		})
	
		.then( ( value: Error | Buffer ) =>
		{
			console.log( "Value", value.toString() );
		})
	
		.catch( reason => console.error(reason) );
		
	}
}

Main();




