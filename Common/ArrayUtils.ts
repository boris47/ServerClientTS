
import { IsTypeOf } from "./GenericUtils";


/////////////////////////////////////////////////////////////////////////////////////////
/** Return a boolean indicating if every element of the array, if is array, is of given type ( interfaces are not identified )
 * @param array the expencted array to examinate
 * @param type the string of type or class
 */
export function IsArrayOf( array : object, type : any )
{
	if ( Array.isArray( array ) )
	{
		return array.length > 0 && array.every( el => IsTypeOf( el, type ) );
	}
	return false;
}


/////////////////////////////////////////////////////////////////////////////////////////
/** Return the same array but filtered of element not responding to given predicate
 * @param array 
 * @param predicate 
 */
export function FilterArray<T>( array: T[], predicate: ( value : T ) => boolean )
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