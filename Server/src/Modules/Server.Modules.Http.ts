
import * as http from 'http';
import * as net from 'net';

import * as ComUtils from '../../../Common/Utils/ComUtils';
import { ResponsesMap, IResponsesMapItem } from '../Responses/Server.Responses.Map';
import { ServerInfo } from '../Server.Globals';
import ServerUserRequestHandler from '../Users/Server.User.RequestHandler';
import ServerResponsesProcessing, { IServerRequestInternalOptions } from '../Responses/Server.Responses.Processing';
import { HTTPCodes } from '../HTTP.Codes';


export default class HttpModule
{
	private static instance: HttpModule = null;
	private server : http.Server = null;


	/////////////////////////////////////////////////////////////////////////////////////////
	public static async Initialize() : Promise<boolean>
	{
		if ( !HttpModule.instance )
		{
			const serverOptions: http.ServerOptions =
			{
				
			};
		
			const listenOptions: net.ListenOptions =
			{
				port : ServerInfo.HTTP_SERVER_PORT,
				host : '0.0.0.0',
			}
	
			const httpModule = new HttpModule();
			if( await httpModule.Initialize( serverOptions, listenOptions ) )
			{
				HttpModule.instance = httpModule;
			}
		}
		return !!HttpModule.instance;
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public static async Finalize(): Promise<void>
	{
		await HttpModule.instance.Finalize();
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////
	private async Initialize( serverOptions : http.ServerOptions, listenOptions : net.ListenOptions ) : Promise<boolean>
	{
		const server : http.Server = http.createServer( serverOptions );
		server.on('error', console.error);
		server.on('request', this.HandleRequest);

		this.server = server;

		await new Promise<void>( (resolve) =>
		{
			server.listen( listenOptions, () =>
			{
				const  { address, family, port } = server.address() as net.AddressInfo || {};
				console.log( `Node server created at ${address}, port:${port}` );
				ServerInfo.HTTP_SERVER_PORT = port;
				ServerInfo.HTTP_SERVER_ADDRESS = address;
				resolve();
			});
		});
//		const result00 = await ServerCommunications.AddPortForwarding( ServerInfo.HTTP_SERVER_ADDRESS, ServerInfo.HTTP_SERVER_PORT, ServerInfo.MACHINE_PUBLIC_IP, ServerInfo.HTTP_SERVER_PORT );
//		this.ruleName = await ServerCommunications.AddFirewallRule( ServerInfo.HTTP_SERVER_ADDRESS, ServerInfo.HTTP_SERVER_PORT );
	//	const result10 = await ServerCommunications.RemovePortForwarding( ServerInfo.HTTP_SERVER_ADDRESS, ServerInfo.HTTP_SERVER_PORT );
		return true;
	}
	
	
	/////////////////////////////////////////////////////////////////////////////////////////
	private async Finalize(): Promise<void>
	{
		console.log(`HttpModule.Finalize:Closing Http Server`);
		const error: Error | undefined = await new Promise( ( resolve ) =>
		{
			HttpModule.instance.server.close(resolve);
		});
		if ( error )
		{
			console.error( error.name, error.message );
		}
		
		console.log(`HttpModule.Finalize:Http Server Closed`);
		
//		const result11 = await ServerCommunications.RemoveFirewallRule( this.ruleName );
//		const result1 = await ServerCommunications.RemovePortForwarding( ServerInfo.HTTP_SERVER_ADDRESS, ServerInfo.HTTP_SERVER_PORT );
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	private static ReportResponseResult( request : http.IncomingMessage, value : Buffer | Error, durationMS : number, context?: string ) : void
	{
		const {address} = request.socket?.address() as net.AddressInfo  || {};
		console[(Buffer.isBuffer(value) ? 'log':'warn')](
		[
			`Incoming: Origin:'${address}', Path: '${request.url}', Method: '${request.method}', ${context ?`Context: '${context}',`: ''} Result: ${Buffer.isBuffer(value)?'good':'bad'}, Duration: ${(durationMS).toString()}ms`,
			`Body: ${value.toString()}\n`,
		].join('\n\t'));
	};


	/////////////////////////////////////////////////////////////////////////////////////////
	private static async NotExistingPath(request: http.IncomingMessage, response: http.ServerResponse): Promise<Buffer | Error>
	{
		const options: IServerRequestInternalOptions =
		{
			Value: Buffer.from(HTTPCodes[404]) // Not Found
		};
		const result: Buffer | Error = await ServerResponsesProcessing.ProcessSimpleResponse(request, response, options);
		return result;
	};


	/////////////////////////////////////////////////////////////////////////////////////////
	private static async MethodNotAllowed(request: http.IncomingMessage, response: http.ServerResponse): Promise<Buffer | Error>
	{
		const options: IServerRequestInternalOptions =
		{
			Value: Buffer.from(HTTPCodes[405]) // Method Not Allowed
		};
		const result: Buffer | Error = await ServerResponsesProcessing.ProcessSimpleResponse(request, response, options);
		return result;
	};


	/////////////////////////////////////////////////////////////////////////////////////////
	private async HandleRequest( request : http.IncomingMessage, response : http.ServerResponse )
	{
		const startTime = Date.now();
		const path: string = request.url.split('?')[0];
		const responseMapItem : IResponsesMapItem = ResponsesMap[path];

		console.log(`Received request: url '${request.url}', method '${request.method}'`);

		// Check Auths
		const userRequestApprovation = await ServerUserRequestHandler.CheckUserAuths(path, responseMapItem?.requiresAuth, request, response);
		if ( !Buffer.isBuffer(userRequestApprovation) )
		{
			return HttpModule.ReportResponseResult( request, userRequestApprovation, Date.now() - startTime );
		}

		const method = responseMapItem ? ( responseMapItem.responseMethods[request.method.toLowerCase()] || ( HttpModule.MethodNotAllowed )) : ( HttpModule.NotExistingPath );
		method( request, response ).then( ( value: Buffer | Error ) =>
		{
			HttpModule.ReportResponseResult( request, value, Date.now() - startTime, method.name );
		});
	};

}