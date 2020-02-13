
import * as http from 'http';
import * as fs from 'fs';

import { IServerInfo, IClientRequestResult } from '../Common/Interfaces'
import { ClientRequests } from './Client.Requests';

const delay = ( ms : number = 1000 ) => {
    return new Promise( (resolve, reject) => {
        setTimeout (() => {
            resolve(1);
        }, ms);
    });
};


let serverPublicIp = "0.0.0.0";
const serverConfigFileName = './ServerCfg.json';
if ( fs.existsSync( serverConfigFileName ) )
{
	const fileContent = fs.readFileSync( serverConfigFileName, 'UTF-8' );
	const fileJson : IServerInfo = JSON.parse( fileContent );
	serverPublicIp = fileJson.ServerIp;
}

const CommonOptions : http.RequestOptions = {
	host: `${serverPublicIp}`,
	port: 3000,
	timeout : 500,
};

interface IClientRequest {
	path : string,
	method : string,
	reqArgs : string[]
}

const requestsToProcess : Array<IClientRequest> = new Array<IClientRequest>();

async function ProcessRequest()
{
	if ( requestsToProcess.length === 0 )
	{
		console.log( "CLIENT JOB COMPLETED" );
		return process.exit(0);
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


	const result : string = await requestFunction( Object.assign({}, CommonOptions, request ), ...request.reqArgs );
	if ( result )
	{
		console.log( `request satisfied for ${request.path}\n` + JSON.stringify( result, null, '\t' ) );
	}
	else
	{
		console.error( "failed request", request.path );
	}

}

function AddRequest( path : string, method : string, ...args:string[] )
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
	while( true )
	{
		await delay();
		await ProcessRequest();
	}
}

	AddRequest( '/ping', 'get' );
	AddRequest( '/upload', 'put', 'Client.js' );
	AddRequest( '/download', 'get', 'Server.js' );
	AddRequest( '/data', 'put', 'MyDataName', "123" );
	AddRequest( '/data', 'get', 'MyDataName' );


Main();






