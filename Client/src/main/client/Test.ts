
import {
	Request_ServerPing,
//	Request_UserRegister,
	Request_UserLogin,
	Request_StorageList,
	Request_StorageResourceUpload,
	Request_StorageResourceDownload,
	Request_StorageGetData,
	Request_StoragePutData
} from "./client.Bridge";

import { InstallRequestsProcessor } from "./client.Bridge";
import { ComFlowManager } from "../../../../Common/Utils/ComUtils";
import CustomLocalStorage from "../LocalStorage";

async function Main()
{
	process.env.NODE_ENV = 'development';
	await InstallRequestsProcessor();
	{
		await CustomLocalStorage.Initialize('ClientTS', 'cookies');

		Request_ServerPing()
		.then( ( result : Buffer | Error ) =>
		{
			return Buffer.isBuffer(result) ? Request_UserLogin('Rob', 'erto') : Promise.reject(result);
		})
		.then( ( result : Buffer | Error ) =>
		{
			if ( Buffer.isBuffer(result) )
			{
				customLocalStorage.AddResource( 'token', result, true );
				customLocalStorage.SaveStorage();
				return Request_StorageList( new ComFlowManager );
			}
			return Promise.reject(result);
		})
	
		.then( ( result : Buffer | Error ) =>
		{
			return Buffer.isBuffer(result) ? Request_StorageResourceUpload( new ComFlowManager, './Tests/RequestResourceUpload/GPU-Z.2.25.0.exe' ) : Promise.reject(result);
		})
	
		.then( ( result : Buffer | Error ) =>
		{
			return Buffer.isBuffer(result) ? Request_StorageResourceDownload( new ComFlowManager, 'GPU-Z.2.25.0.exe', 'E:/SourceTree/ServerClientTS/Client/Tests/RequestResourceDownload' ) : Promise.reject(result);
		})
	
		.then( ( result : Buffer | Error ) =>
		{
			return Buffer.isBuffer(result) ? Request_StoragePutData( new ComFlowManager, 'MyDataName', '123' ) : Promise.reject(result);
		})
	
		.then( ( result : Buffer | Error ) =>
		{
			return Buffer.isBuffer(result) ? Request_StorageGetData( new ComFlowManager, 'MyDataName' ) : Promise.reject(result);
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




