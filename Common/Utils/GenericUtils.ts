
//	import * as crypto from 'crypto';

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


export type GenericConstructor<T> = { new( ...Args:any[] ) : T };
export default class GenericUtils
{
	/////////////////////////////////////////////////////////////////////////////////////////
	public static Instanciate<T>( Constructor: GenericConstructor<T>, ...Args:any[] ): T
	{
		return new Constructor( Args );
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static IsTypeOf<T = any>(value: T, type: string | { new(...args: any[]): T; }): value is T
	{
		return (typeof type === 'string' ? (e: any) => typeof e === type : (e: any) => e instanceof type)(value);
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public static DelayMS( ms : number ) : Promise<void>
	{
		return new Promise<void>( ( resolve ) => setTimeout( resolve, ms ) );
	};
}