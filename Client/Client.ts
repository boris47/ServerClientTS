
import * as http from 'http';
import * as fs from 'fs';

import { IServerInfo, IClientRequestResult } from '../Common/Interfaces'
import { ClientRequests, IClientRequestInternalOptions } from './Client.Requests';


let serverPublicIp = "0.0.0.0";// "0.0.0.0";
const serverConfigFileName = './ServerCfg.json';
if ( fs.existsSync( serverConfigFileName ) )
{
	const fileContent = fs.readFileSync( serverConfigFileName, 'utf8' );
	const fileJson : IServerInfo = JSON.parse( fileContent );
//	serverPublicIp = fileJson.ServerIp;
}

const CommonOptions : http.RequestOptions = {
	host: `${serverPublicIp}`,
	port: 3000,
	timeout : 500,
};

interface IClientRequest {
	path : string,
	method : string,
	reqArgs : IClientRequestInternalOptions
}

const requestsToProcess : Array<IClientRequest> = new Array<IClientRequest>();

async function ProcessRequest()
{
	if ( requestsToProcess.length === 0 )
	{
		console.log( "CLIENT JOB COMPLETED" );
		process.exit(0);
	}

	let requestFunction = null;
	const request : IClientRequest = requestsToProcess.shift();
	switch( request.method )
	{
		case 'get' :
		{
			requestFunction = request.path.startsWith('/download') ? ClientRequests.DownloadFile : ClientRequests.Request_GET;
			break;
		}
		case 'put' :
		{
			requestFunction = request.path.startsWith('/upload') ? ClientRequests.UploadFile : ClientRequests.Request_PUT;
			break;	
		}
		default: {
			return;
		}
	}

	console.log( "Doing request", request.method, request.path, JSON.stringify( request.reqArgs ) );
	const result : IClientRequestResult = await requestFunction( Object.assign({}, CommonOptions, request ), request.reqArgs );
	if ( result )
	{
		console.log( `request satisfied for ${request.path}\nResult: ${result.bHasGoodResult}` /* + JSON.stringify( result, null, '\t' )*/ );
	}
	else
	{
		console.error( "failed request", request.path );
	}

}

function AddRequest( path : string, method : string, args:IClientRequestInternalOptions = {} )
{
	if ( typeof path === 'string' )
	{
		const newRequest : IClientRequest = {
			path : path,
			method : method.toLowerCase(),
			reqArgs : args
		};
		requestsToProcess.push( newRequest );
	}
}

async function Main()
{
	{
		AddRequest( '/ping', 'get' );
		AddRequest( '/upload', 'put', <IClientRequestInternalOptions>{ AbsoluteFilePath: './Client.js' } );
		AddRequest( '/download', 'get', <IClientRequestInternalOptions>{ AbsoluteFilePath: 'Server.js' } );
		AddRequest( '/data', 'put', <IClientRequestInternalOptions>{ Key : 'MyDataName', Value: '123' } );
		AddRequest( '/data', 'get', <IClientRequestInternalOptions>{ Key: 'MyDataName' } );
	}

	while( true )
	{
//		await GenericUtils.DelayMS( 1000 );
		await ProcessRequest();
	}
}

Main();






