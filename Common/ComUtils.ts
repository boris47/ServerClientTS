
import { ICommonResult } from '../Common/Interfaces';
import * as http from 'http';
import * as https from 'https';

export async function HTTP_Get( url : string ) : Promise<string | null>
{
	return await new Promise<string | null>( ( resolve ) =>
	{
		const request = https.get( url, function( response : http.IncomingMessage )
		{
			let rawData = "";
			response.on('data', function( chunk : any )
			{
				rawData += chunk;
			});

			response.on('end', function()
			{
				resolve( rawData.trim() );
			});

			response.on( "error", function( err: Error )
			{
				console.error( "HTTP_Get:\t", err.name, err.message );
				resolve( null );
			})
		});

		request.on( "error", function( err: Error )
		{
			console.error( "HTTP_Get:\t", err.name, err.message );
			resolve( null );
		});
	})
}


export async function ResolveWithGoodResult<T extends ICommonResult>( body : Buffer, cb? : ( value: T ) => void  ) : Promise<T>
{
	const resultObject = <T>{};
	resultObject.body = body;
	resultObject.bHasGoodResult = true;
	if ( typeof cb === 'function' )
	{
		cb( resultObject );
	}
	return resultObject
}

export async function ResolveWithError<T extends ICommonResult>( errName : string, errMessage : string | Error, cb? : (value: T) => void ) : Promise<T>
{
	let msg = '';
	if ( typeof errMessage === 'string' )
	{
		msg = `${errMessage}`;
	}
	else
	{
		msg = `${errMessage.name}:${errMessage.message}`;
	}

	const resultObject = <T>{};
	const body = `${errName}.\n${msg}`;
	resultObject.body = Buffer.from( body );
	resultObject.bHasGoodResult = false;
	if ( typeof cb === 'function' )
	{
		cb( resultObject );
	}
	return resultObject;
}