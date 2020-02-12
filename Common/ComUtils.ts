
import { ICommonResult } from '../Common/Interfaces'

export async function ResolveWithGoodResult<T extends ICommonResult>( body : string, cb : ( value: T ) => void  )
{
	const resultObject = <T>{};
	resultObject.body = body;
	resultObject.bHasGoodResult = true;
	return cb( resultObject );
}

export async function ResolveWithError<T extends ICommonResult>( errName : string, errMessage : string, cb : (value: T) => void )
{
	const resultObject = <T>{};
	const body = `${errName}.\n${errMessage}`;
	resultObject.body = body;
	resultObject.bHasGoodResult = false;
	return cb( resultObject );
}