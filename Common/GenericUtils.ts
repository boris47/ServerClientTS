

export const DelayMS = ( ms : number )  : Promise<void> =>
{
	return new Promise<void>( ( resolve ) =>
	{
		const callback = () =>
		{
			resolve();
		}
		setTimeout( callback, ms );
	});
};


/**
 * Return the same array but filtered of element not responding to given predicate
 * @param myArray 
 * @param predicate 
 */
export function FilterArray<T>( myArray: T[], predicate: ( value : T ) => boolean )
{
	if( predicate )
	{
		for ( let index = myArray.length - 1; index >= 0; index-- )
		{
			const element : T = myArray[index];
			if ( !predicate( element ) )
			{
				myArray.splice( index, 1 );
			}
		}
	}
	return myArray;
}