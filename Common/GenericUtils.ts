
import { IURLParseResult } from "./Interfaces";
import * as crypto from 'crypto';


/////////////////////////////////////////////////////////////////////////////////////////
export class UniqueID
{
	private static internalIndex = 0;

	public static Generate() : string
	{
	//	return [2, 2, 2, 6].reduce( ( previous : string, length : number ) =>
	//		{
	//			return `${previous}-${crypto.randomBytes(length).toString('hex')}`;
	//		},
	//		crypto.randomBytes(4).toString('hex')
	//	);
		const time = Math.floor( ( new Date().getTime() + ++UniqueID.internalIndex ) / 16 );
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c)
		{
			const random = ( time + ( Math.random() * 16 ) )%16 | 0;
			return (c === 'x' ? random : ( random & 0x3 | 0x8 ) ).toString( 16 );
		});
	}
	
}


/////////////////////////////////////////////////////////////////////////////////////////
export type GenericConstructor<T> = { new( ...Args:any[] ) : T };
export function Construct<T>( Constructor: GenericConstructor<T>, ...Args:any[] ): T
{
	return new Constructor( Args );
}


/////////////////////////////////////////////////////////////////////////////////////////
export function DelayMS( ms : number ) : Promise<void>
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


/////////////////////////////////////////////////////////////////////////////////////////
export function ToBuffer( data : ( number[] | Uint8Array | string | ArrayBuffer | SharedArrayBuffer ), ...argArray: any[] )
{
	return Buffer.from.call( Buffer, data, argArray );
}


/////////////////////////////////////////////////////////////////////////////////////////
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

/**
 * https://www.google.com/search?
 * // Key Value pair
 * biw=1920
 * // Array
 * &array=["ciao"-"caio2"]
 * // Switches
 * &mamma
 * &meli
 */

// 'https://www.google.com/search?&array=["ciao"-"caio2"]&switch'

/////////////////////////////////////////////////////////////////////////////////////////
export function URl_Parse( url : string ) : IURLParseResult
{
	// import * as querystring from 'querystring';
	// querystring.parse( 'foo=bar&abc=xyz&abc=123' )
	// parsed into { foo: 'bar', abc: ['xyz', '123'] }

	// querystring.stringify({ foo: 'bar', baz: ['qux', 'quux'], corge: '' });
	// Returns 'foo=bar&baz=qux&baz=quux&corge='
	// -
	// querystring.stringify({ foo: 'bar', baz: 'qux' }, ';', ':');
	// Returns 'foo:bar;baz:qux'

	const parts = url.substr( url.indexOf( '?' ) + 1 ).split('&');

	const bIsKeyValuePair = ( entry : string ) : boolean =>
	{
		if ( !bIsArray( entry ) && !bHasSwitches( entry ) )
		{
			return true;
		}
		return false;
	}

	const bHasSwitches = ( entry : string ) : boolean =>
	{
		return !entry.includes('=');
	}

	const bIsArray = ( entry : string ) =>
	{
		const value = entry.split('=')[1];
		return ( value?.startsWith('[') && value?.endsWith(']') ) || false;
	}

	const result : IURLParseResult = <IURLParseResult>{};
	{
		const keyValues = new Map<string, string>();
		const switches = new Array<string>();
		const arrays = new Map<string, string[]>();
		
		parts.forEach( ( entry : string ) =>
		{
			// KeyValues map
			{
				if ( bIsKeyValuePair( entry ) )
				{
					const pair = entry.split('=');
					keyValues.set( pair[0], pair[1] );
				}
			}
			// Switchers
			{
				if ( bHasSwitches( entry ) )
				{
					switches.push( entry );
				}
			}
			// Arrays
			{
				if ( bIsArray( entry ) )
				{
					const key = entry.split('=')[0];
					const array = entry.split('=')[1];
					const arrayContent = array.substring( 1, array.length - 1 );
					arrays.set( key, arrayContent.split('-').filter( s => s.length > 0 ).map( s => s.replace(/"/g, '') ) );
				}
			}
		});

		result.KeyValues = keyValues;
		result.Switches = switches;
		result.Arrays = arrays;
	}
	return result;
}
