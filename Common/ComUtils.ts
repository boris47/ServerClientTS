
import { ICommonResult } from '../Common/Interfaces';
import * as http from 'http';
import * as https from 'https';

export async function HTTP_Get( url : string, headers?: http.OutgoingHttpHeaders ) : Promise<Buffer | null>
{
	return await new Promise<Buffer | null>( ( resolve ) =>
	{
		const request = https.get( url, { headers: headers }, function( response : http.IncomingMessage )
		{
			const body : Buffer[] = [];
			response.on('data', function( chunk : any )
			{
				body.push( Buffer.from( chunk ) );
			});

			response.on('end', function()
			{
				const result : Buffer = Buffer.concat( body );
				resolve( result );
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