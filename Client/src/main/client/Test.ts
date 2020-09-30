
import {
	Request_UserRegister,
	Request_UserLogin,
	Request_ResourceUpload,
	Request_ResourceDownload,
	Request_StorageGetData,
	Request_StoragePutData
} from "./client.Bridge";

import { InstallRequestsProcessor } from "./client.Bridge";
import { ComFlowManager } from "../../../../Common/Utils/ComUtils";
import FS_Storage from "../../../../Common/FS_Storage";
import { IPackageJSON } from "../../../../Common/IPackageJSON";
import WebSocketManager from "./client.Modules.WebSocket";

const { config: { name } }: IPackageJSON = require('../../../package.json');


process.on('exit', (code: number) =>
{
	WebSocketManager.Finalize();
});

async function Main()
{
	process.env.NODE_ENV = 'development';
	await InstallRequestsProcessor();
	{
		await FS_Storage.Initialize(name, 'cookies');
		await FS_Storage.LoadStorage();

		Request_UserRegister('Rob', 'erto')
		.then( ( result : Buffer | Error ) =>
		{
			return Buffer.isBuffer(result) ? Request_UserLogin('Rob', 'erto') : Promise.reject(result);
		})

		.then( ( result : Buffer | Error ) =>
		{
			return Buffer.isBuffer(result) ? Request_ResourceUpload( new ComFlowManager('Upload'), './Tests/RequestResourceUpload/GPU-Z.2.25.0.exe' ) : Promise.reject(result);
		})

		.then( ( result : Buffer | Error ) =>
		{
			return Buffer.isBuffer(result) ? Request_ResourceDownload( new ComFlowManager('Download'), 'GPU-Z.2.25.0.exe', 'E:/SourceTree/ServerClientTS/Client/Tests/RequestResourceDownload' ) : Promise.reject(result);
		})

		.then( ( result : Buffer | Error ) =>
		{
			return Buffer.isBuffer(result) ? Request_StoragePutData( new ComFlowManager('Put Data'), 'MyDataName', '123' ) : Promise.reject(result);
		})

		.then( ( result : Buffer | Error ) =>
		{
			return Buffer.isBuffer(result) ? Request_StorageGetData( new ComFlowManager('Get Data'), 'MyDataName' ) : Promise.reject(result);
		})

		.then( ( value: Error | Buffer ) =>
		{
			console.log( "Value", value.toString() );
			process.exit(0);
		})

		.catch( ( reason: Error ) =>
		{
			console.warn(reason);
			process.exit(0);
		});
		
	}
}

Main();




