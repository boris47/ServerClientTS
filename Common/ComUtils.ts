
import { ICommonResult } from '../Common/Interfaces'

/*
	private static EndResponseWithError( response : http.ServerResponse, errMessage : string | Error, errCode : number ) : void
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

		response.statusCode = errCode;
		response.statusMessage = msg;
		response.end();
	}
*/

export async function ResolveWithGoodResult<T extends ICommonResult>( body : string, cb : ( value: T ) => void  )
{
	const resultObject = <T>{};
	resultObject.body = body;
	resultObject.bHasGoodResult = true;
	return cb( resultObject );
}

export async function ResolveWithError<T extends ICommonResult>( errName : string, errMessage : string | Error, cb : (value: T) => void )
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
	resultObject.body = body;
	resultObject.bHasGoodResult = false;
	return cb( resultObject );
}