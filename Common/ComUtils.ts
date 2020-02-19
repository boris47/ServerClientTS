
import { ICommonResult } from '../Common/Interfaces'


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