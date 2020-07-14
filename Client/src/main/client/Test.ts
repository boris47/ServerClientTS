
import {
//	RequestServerPing,
	RequestUserRegister,
	RequestLogin,
	RequestStorageList,
	RequestResourceUpload,
	RequestResourceDownload,
	RequestGetData,
	RequestPutData
} from "./client";

import { InstallRequestsProcessor } from "./client";
import { ComFlowManager } from "../../../../Common/Utils/ComUtils";

async function Main()
{
	process.env.NODE_ENV = 'development';
	await InstallRequestsProcessor();
	{
		RequestUserRegister('Rob', 'erto')
		
		.then( ( result : Buffer | Error ) =>
		{
			return Buffer.isBuffer(result) ? RequestLogin(result.toString()) : Promise.reject(result);
		})
	//	RequestServerPing()
		.then( ( result : Buffer | Error ) =>
		{
			return Buffer.isBuffer(result) ? RequestStorageList( new ComFlowManager ) : Promise.reject(result);
		})
	
		.then( ( result : Buffer | Error ) =>
		{
			return Buffer.isBuffer(result) ? RequestResourceUpload( new ComFlowManager, './Tests/RequestResourceUpload/GPU-Z.2.25.0.exe' ) : Promise.reject(result);
		})
	
		.then( ( result : Buffer | Error ) =>
		{
			return Buffer.isBuffer(result) ? RequestResourceDownload( new ComFlowManager, 'GPU-Z.2.25.0.exe', 'E:/SourceTree/ServerClientTS/Client/Tests/RequestResourceDownload' ) : Promise.reject(result);
		})
	
		.then( ( result : Buffer | Error ) =>
		{
			return Buffer.isBuffer(result) ? RequestPutData( new ComFlowManager, 'MyDataName', '123' ) : Promise.reject(result);
		})
	
		.then( ( result : Buffer | Error ) =>
		{
			return Buffer.isBuffer(result) ? RequestGetData( new ComFlowManager, 'MyDataName' ) : Promise.reject(result);
		})
	
		.then( ( value: Error | Buffer ) =>
		{
			console.log( "Value", value.toString() );
		})
	
		.catch( reason => {
			console.log();
		}/*console.error(reason)*/ );
		
	}
}

Main();




