
import * as crypto from 'crypto';
import * as stream from 'stream';

export class CustomCrypto
{
	public static Encrypt(text: string, passPhrase32Bit: string, iv: string): string
	{
		if (text.length === 0) return '';
		const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(passPhrase32Bit), iv);
		const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
		return encrypted.toString('hex');
	}

	public static Decrypt(text: string, passPhrase32Bit: string, iv: string): string
	{
		const encryptedText = Buffer.from(text, 'hex');
		if (encryptedText.byteLength === 0) return text;

		const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(passPhrase32Bit), iv);
		const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
		return decrypted.toString();
	}
}


/////////////////////////////////////////////////////////////////////////////////////////
export class UniqueID
{
	private static internalIndex = 0;

	public static Generate(): string
	{
		//	return [2, 2, 2, 6].reduce( ( previous : string, length : number ) =>
		//		{
		//			return `${previous}-${crypto.randomBytes(length).toString('hex')}`;
		//		},
		//		crypto.randomBytes(4).toString('hex')
		//	);
		const time = Math.floor((new Date().getTime() + ++UniqueID.internalIndex) / 16);
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c)
		{
			const random = (time + (Math.random() * 16)) % 16 | 0;
			return (c === 'x' ? random : (random & 0x3 | 0x8)).toString(16);
		});
	}
}


export interface ITemplatedObject<T = any>
{
	[key: string]: T;
}

export function Yieldable<T>(fn: () => T): Promise<T>
{
	return Promise.resolve().then(fn);
}


export type GenericConstructor<T> = { new(...args: any[]): T; };
export type Constructor<T> = Function & { prototype: T };

export default class GenericUtils
{
	/////////////////////////////////////////////////////////////////////////////////////////
	public static Instanciate<T>(constructor: GenericConstructor<T>, ...args: any[]): T
	{
		return new constructor(args);
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static Parse<T = Object>( content: string, ctor?: (arg: object) => T ) : Error | T
	{
		if (typeof content !== 'string' || content.length === 0)
		{
			return new Error(`GenericUtils.TryParse: Content is invalid`);
		}

		let result : T | object = null;
		try {
			result = JSON.parse(content);
		} catch (error) {
			return new Error(`GenericUtils.TryParse: Unable to parsed content, ${error}`);
		}

		if (ctor)
		{
			return ctor(result as object);
		}
		return result as T;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static BufferToStream(buffer: Buffer): stream.Readable
	{ 
		const readable = new stream.Readable();
		readable.push(buffer);
		readable.push(null);
		return readable;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	/**
	 * @param value Value to examinate
	 * @param type -
	 * - A type `string` ('string', 'number', ...),
	 * - a `class` (Error, Buffer, ...)
	 * - an `abstract class`
	 */
	public static IsTypeOf<T = any>(value: any, type: string | { new(...args: any[]): T; } | Constructor<T>): value is T
	{
		return (typeof type === 'string' ? (e: any) => typeof e === type : (e: any) => e instanceof type)(value);
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public static IsPromise<TResult = any>(obj: any): obj is Promise<TResult>
	{
		return obj && typeof(obj.then) === 'function' && typeof(obj.finally) === 'function';
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public static DelayMS(ms: number): Promise<void>
	{
		return new Promise<void>((resolve) => setTimeout(resolve, ms));
	};

	
	/////////////////////////////////////////////////////////////////////////////////////////
	public static async WaitFrames(frameCount: number): Promise<void>
	{
		for (let index = 0; index < frameCount; index++) await GenericUtils.DelayMS(1);
	}
}




/**
 * Provides a mechanism for releasing resources.
 */
export interface IDisposable
{
	dispose(): void  | Promise<void>;
}

/**
 * Provides a convenient syntax that ensures the correct use of IDisposable objects
 * @example
 *   await using(ioc.get<IUdpClient>(types.IUdpClient), async (client) =>
 *   {
 *	     await Task.delay(1000);
 *	 });
 *	 console.log("end");
 */
export async function using<T extends IDisposable>(resource: T, func: (resource: T) => void | Promise<void>)
{
	try
	{
		await Promise.resolve(func(resource));
	}
	finally
	{
		await Promise.resolve( resource.dispose() );
	}
}