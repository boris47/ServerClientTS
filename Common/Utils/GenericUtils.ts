
import * as crypto from 'crypto';
import * as stream from 'stream';


/////////////////////////////////////////////////////////////////////////////////////////
export class CustomCrypto
{
	/**  */
	public static Encrypt(text: string, passPhrase32Bit: string, iv: string): string
	{
		if (text.length === 0) return '';
		const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(passPhrase32Bit), iv);
		const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
		return encrypted.toString('hex');
	}

	/**  */
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

	/**  */
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


/////////////////////////////////////////////////////////////////////////////////////////
export interface ITemplatedObject<T = any>
{
	[key: string]: T;
}


/////////////////////////////////////////////////////////////////////////////////////////
export const Yieldable = <T>(fn: () => T): Promise<T> => Promise.resolve().then(fn);


/////////////////////////////////////////////////////////////////////////////////////////
export type GenericConstructor<T> = { new(...args: any[]): T; };
export type Constructor<T> = Function & { prototype: T };


export class CustomWritableStream extends stream.Writable implements IDisposable
{
	private data: Buffer[] = new Array<Buffer>();
	private totalLength: number = 0;
	private result: Buffer | undefined = undefined;

	get Data(): Buffer | undefined
	{
		return this.result;
	}

	constructor(opts?: stream.WritableOptions | undefined)
	{
		super(opts);
	}

	dispose(): void | Promise<void>
	{
		this.data.splice(0, this.data.length - 1);
		this.result = undefined;
	}

	_write(chunk: Buffer, encoding: string, callback: (error?: Error | null) => void)
	{
		this.totalLength += chunk.length;
		this.data.push(chunk);
	}

	// The overload signatures:
	public end(): void;
	public end(chunk: any, cb?: Function): void;
	public end(chunk: any, encoding?: string, cb?: Function): void;

	// The implementation:
	public end(...args: any[]): void
	{
		this.result = Buffer.concat(this.data,  this.totalLength);
		super.end(...args);
	}
}

// Ref: https://gist.github.com/4poc/1454516/8208b391adf7b7af8841c1bee6309f66eb244535
export class StreamLimitator extends stream.Transform
{
	protected previousPassTime : number = Date.now();
	protected intervalId: any = null;
	protected interval: number = 0;

	protected bytes: number = 0;
	protected queue: number[] = new Array<number>();

	/**
	 * @param bytes Size of a chunk to be read per interval
	 * @param interval Time between chunk passing. In miliseconds
	 */
	constructor(bytes: number, interval: number)
	{
		super();
		this.bytes = bytes;
		this.interval = interval;
	}

	_transform(chunks: Buffer, encoding: string, callback: stream.TransformCallback): void
	{
	//	console.log("_transform");
		this.queue.push(...chunks);
		this.isQueueFull() ? setTimeout(callback, this.interval) : callback();
	}

	_flush(callback: stream.TransformCallback)
	{
	//	console.log("_flush");
		clearInterval(this.intervalId);
		this.intervalId = this.setPushInterval(callback);
	}

	setPushInterval(callback: stream.TransformCallback = null)
	{
		const lambda = () =>
		{
			const elapsedTime = Date.now() - this.previousPassTime;
			if (elapsedTime < this.interval) return;
			
			if (this.queue.length > 0)
			{
			//	console.log('interval', `pushing (${this.queue.length})`);
				this.push(this.getChunk());
				return this.previousPassTime += elapsedTime;
			}

			clearInterval(this.intervalId);
			return callback && callback();
		};
		return setInterval(lambda, this.interval / 10);
	}

	getChunk()
	{
		return Buffer.from(this.queue.splice(0, this.bytes));
	}

	isQueueFull()
	{
		return this.queue.length >= 2 * this.bytes;
	}
}


/////////////////////////////////////////////////////////////////////////////////////////
export default class GenericUtils
{
	/**  */
	public static Instanciate<T>(constructor: GenericConstructor<T>, ...args: any[]): T
	{
		return new constructor(args);
	}

	/**  */
	public static Parse<T = Object>( content: string, ctor?: (arg: object) => T ) : Error | T
	{
		if (typeof content !== 'string' || content.length === 0)
		{
			return new Error(`GenericUtils.TryParse: Content is invalid`);
		}

		let result : T | object = {};
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

	/**  */
	public static BufferToStream(buffer: Buffer): stream.Readable
	{ 
		const readable = new stream.Readable();
		readable.push(buffer);
		readable.push(null);
		return readable;
	}

	/** 
	 * @param value Value to examinate
	 * @param type -
	 * - A type `string` ('string', 'number', ...),
	 * - a `class` (Error, Buffer, ...)
	 * - an `abstract class`
	 */
	public static IsTypeOf<T = any>(value: any, type: string | GenericConstructor<T> | Constructor<T>): value is T
	{
		return (typeof type === 'string' ? (e: any) => typeof e === type : (e: any) => e instanceof type)(value);
	}

	/**  */
	public static IsPromise<TResult = any>(obj: any): obj is Promise<TResult>
	{
		return obj && typeof(obj.then) === 'function' && typeof(obj.finally) === 'function';
	}
	
	/**  */
	public static IsStream(obj: any): obj is stream.Stream
	{
		return typeof obj === 'object' && typeof obj.pipe === 'function';
	}

	/**  */
	public static IsStreamRead(obj: any): obj is stream.Readable
	{
		return typeof obj === 'object' && typeof obj.pipe === 'function'
		&& obj.readable !== false
		&& typeof obj._read === 'function'
		&& typeof obj._readableState === 'object';
	}

	/**  */
	public static IsStreamWrite(obj: any): obj is stream.Writable
	{
		return typeof obj === 'object' && typeof obj.pipe === 'function'
		&& obj.writable !== false
		&& typeof obj._write === 'function'
		&& typeof obj._writableState === 'object';
	}

	/** Wait an ammount of milliseconds */
	public static DelayMS(ms: number): Promise<void>
	{
		return new Promise<void>((resolve) => setTimeout(resolve, ms));
	};
	
	/**  */
	public static async WaitFrames(frameCount: number): Promise<void>
	{
		for (let index = 0; index < frameCount; index++) await GenericUtils.DelayMS(1);
	}
}


/////////////////////////////////////////////////////////////////////////////////////////
/** Provides a mechanism for releasing resources. */
export interface IDisposable
{
	dispose(): void  | Promise<void>;
}


/////////////////////////////////////////////////////////////////////////////////////////
/** Provides a convenient syntax that ensures the correct use of IDisposable objects
 * @example
 * await Using( new Object, async (object: object) =>
 * {
 *     await Task.delay(1000);
 * });
 * console.log("end");
 */
export async function Using<T extends IDisposable, K>(resource: T, func: (resource: T) => K | Promise<K>)
{
	let result = undefined;
	try
	{
		result = await Promise.resolve(func(resource));
	}
	finally
	{
		await Promise.resolve( resource.dispose() );
	}
	return result;
}



/** Transform the type to flag all the desired keys as valid (not never) */
//type FilterFlags<Base, Condition> = { [Key in keyof Base]: Base[Key] extends Condition ? Key : never; };

/** Get the keys that are not flagged as 'never' */
//type AllowedNames<Base, Condition> =  FilterFlags<Base, Condition>[keyof Base];

/** Get interface with only valid keys */
//type SubType<Base, Condition> = Pick<Base, AllowedNames<Base, Condition>>;

