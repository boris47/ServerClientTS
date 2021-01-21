
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

const { config: { name: AppName } }: IPackageJSON = require('../../../package.json');

async function Main()
{
	Request_UserRegister.name
	Request_UserLogin.name
	Request_ResourceUpload.name
	Request_ResourceDownload.name
	Request_StorageGetData.name
	Request_StoragePutData.name
	ComFlowManager.name

	const trasferFileName = /* 'dlc1.rpkg'; */  'GPU-Z.2.25.0.exe'; 

	process.env.NODE_ENV = 'development';
	await InstallRequestsProcessor();
	{
		await FS_Storage.Initialize(AppName, 'cookies');
		await FS_Storage.LoadStorage();

	//	for(let index = 0; index < 20; index++)
		await Promise.resolve(Buffer.from(''))
		// User: Registration
		.then(() => Request_UserRegister('Rob', 'erto') )
		// Userl: Login
		.then((result: Buffer | Error) => Buffer.isBuffer(result) ? Request_UserLogin('Rob', 'erto') : Promise.reject(result))
		// Resource: upload(Requires Auth)
		.then((result: Buffer | Error) => Buffer.isBuffer(result) ? Request_ResourceUpload(new ComFlowManager('Upload'), `.dev/Tests/RequestResourceUpload/${trasferFileName}`) : Promise.reject(result))
		// Resource: Download(Requires Auth)
		.then((result: Buffer | Error) => Buffer.isBuffer(result) ? Request_ResourceDownload(new ComFlowManager('Download'), trasferFileName, '.dev/Tests/RequestResourceDownload') : Promise.reject(result))
		// Storage: Set Data(Requires Auth)
//		.then((result : Buffer | Error) => Buffer.isBuffer(result) ? Request_StoragePutData(new ComFlowManager('Put Data'), 'MyDataName', '123') : Promise.reject(result))
		// Storage: Get Data(Requires Auth)
//		.then((result : Buffer | Error) => Buffer.isBuffer(result) ? Request_StorageGetData(new ComFlowManager('Get Data'), 'MyDataName') : Promise.reject(result))

		// Report and exit
		.then((result : Buffer | Error) => Buffer.isBuffer(result) ? Promise.resolve(result) : Promise.reject(result))
		.then((value: Error | Buffer) => console.log("Value", value.toString()))
		.catch((reason: Error) => console.error(reason));
		
		Promise.resolve().finally(() =>
		{
			return FS_Storage.Finalize();
		})
		.finally(() =>
		{
			const v1 =(process as any)._getActiveHandles();
			const v2 =(process as any)._getActiveRequests();
			console.log(v1, v2);
		});
	}
}

Main();




