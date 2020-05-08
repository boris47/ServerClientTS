

export default class ArrayUtils {
	
	/** Return the same array but filtered of element not responding to given predicate
	 * @param array 
	 * @param predicate 
	 */
	public static FilterArray<T>( array: T[], predicate: ( value : T ) => boolean )
	{
		if( predicate )
		{
			for ( let index = array.length - 1; index >= 0; index-- )
			{
				const element : T = array[index];
				if ( !predicate( element ) )
				{
					array.splice( index, 1 );
				}
			}
		}
		return array;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static IsArrayOfType<T=any>( array : object, type : string | { new(...args: any[]): T } ): array is T[]
	{
		if ( Array.isArray( array ) )
		{
			const predicate = typeof type === 'string' ? ( e : any ) => typeof e === type : ( e : any ) => e instanceof type;
			const bHaveSameType = array.every( e => predicate(e) )
			return array.length > 0 && bHaveSameType;
		}
		return false;
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public static ArrayContainsSomeOf<T=any>( array : object, type : string | { new(...args: any[]): T } ): array is T[]
	{
		if ( Array.isArray( array ) )
		{
			const predicate = typeof type === 'string' ? ( e : any ) => typeof e === type : ( e : any ) => e instanceof type;
			const bHaveSameType = array.some( e => predicate(e) )
			return array.length > 0 && bHaveSameType;
		}
		return false;
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public static ArrayGetItemsOfType<T=any>( array : object, type : string | { new(...args: any[]): T } ) : T[]
	{
		const results = new Array();
		if ( Array.isArray( array ) )
		{
			const predicate = typeof type === 'string' ? ( e : any ) => typeof e === type : ( e : any ) => e instanceof type;
			return array.filter( predicate );
		}
		return results;
	}
}
