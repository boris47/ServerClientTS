
import * as http from 'http';
import * as fs from 'fs';

import { AsyncHttpResponse } from "./HttpResponse";
import { HTTPCodes } from "./HTTP.Codes";
import { IServerResponseResult } from "../Common/Interfaces";
import { ServerResponses } from "./Server.Responses";
import { ServerStorage } from "./Server.Storage";


export const NotImplementedResponse = new AsyncHttpResponse( async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<IServerResponseResult> =>
{
	const options = <IServerRequestInternalOptions>
	{
		Value : `"${HTTPCodes[404]}"`
	};
	const result : IServerResponseResult = await ServerResponses.Request_GET( request, response, options );
	return result;
});


export const MethodNotAllowed = new AsyncHttpResponse( async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<IServerResponseResult> =>
{
	const options = <IServerRequestInternalOptions>
	{
		Value : `"${HTTPCodes[405]}"`
	};
	const result : IServerResponseResult = await ServerResponses.Request_GET( request, response, options );
	return result;
});

const pingResponse = new AsyncHttpResponse( async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<IServerResponseResult> =>
{
	const options = <IServerRequestInternalOptions>
	{
		Value : 'Hi there!'
	};
	const result : IServerResponseResult = await ServerResponses.Request_GET( request, response, options );
	return result;
});

export interface IResponseMethods
{
	post? 		: () => AsyncHttpResponse;
	get? 		: () => AsyncHttpResponse;
	put? 		: () => AsyncHttpResponse;
	patch? 		: () => AsyncHttpResponse;
	delete? 	: () => AsyncHttpResponse;
}

interface ServerResponseMap
{
	[key:string] : IResponseMethods
}

export interface IServerRequestInternalOptions
{
	FileName? : string;
	Key? : string;
	Value? : string | null;
	Headers? : {
		[key:string] : any
	};
	FileStream? : fs.ReadStream;
}

export const ResponsesMap : ServerResponseMap = {

	'/ping' : <IResponseMethods>
	{
		post 		: () => pingResponse,
		get 		: () => pingResponse,
		put 		: () => pingResponse,
		patch 		: () => pingResponse,
		delete 		: () => pingResponse,
	},


	'/upload' : <IResponseMethods>
	{
		put 	: () => new AsyncHttpResponse( async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<IServerResponseResult> =>
		{
			// Execute file upload to client
			const fileName = request.url.split('=')[1];
			const options = <IServerRequestInternalOptions>
			{
				FileName : fileName
			};
			return await ServerResponses.DownloadFile( request, response, options );
		})
	},

	'/download' : <IResponseMethods>
	{
		get 	: () => new AsyncHttpResponse( async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<IServerResponseResult> =>
		{
			// Execute file download server side
			const fileName = request.url.split('=')[1];
			const options = <IServerRequestInternalOptions>
			{
				FileName : fileName
			};
			return await ServerResponses.UploadFile( request, response, options );
		})
	},

	'/data' : <IResponseMethods>
	{
		get		: () => new AsyncHttpResponse( async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<IServerResponseResult> =>
		{
			const key = request.url.split('=')[1];
			const value : string | null = ServerStorage.HasEntry( key ) ? ServerStorage.GetEntry( key ) : null;
			const options = <IServerRequestInternalOptions>
			{
				Key : key,
				Value : value
			};
			return await ServerResponses.Request_GET( request, response, options );
		}),
		put 	: () => new AsyncHttpResponse( async ( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<IServerResponseResult> =>
		{
			const key = request.url.split('=')[1];
			const options = <IServerRequestInternalOptions>
			{
				Key : key
			};
			const result : IServerResponseResult = await ServerResponses.Request_PUT( request, response, options );
			if ( result.bHasGoodResult )
			{
				ServerStorage.AddEntry( key, result.body.toString() );
			}
			return result;
		})
		
	},

};

