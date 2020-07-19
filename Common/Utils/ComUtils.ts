
import * as http from 'http';
import * as https from 'https';
import * as zlib from 'zlib';
import { UniqueID } from './GenericUtils';


/////////////////////////////////////////////////////////////////////////////////////////
enum EComFlowTags
{
	PROGRESS = 'PROGRESS',
}

//
export class ComFlowManager
{
	/** Add tag for channel used for progress data transmission */
	public static readonly ToProgressId = ( baseId: string ) => `${baseId}_${EComFlowTags.PROGRESS}`;

	//
	private readonly id: string = UniqueID.Generate();

	private progress : ComProgress = new ComProgress();

	//
	get Id(): string
	{
		return this.id;
	}

	get Progress() : ComProgress
	{
		return this.progress;
	}
}

//
export class ComProgress
{
	private static bumpCallback = () => {};
	private callback : (maxValue: number, currentValue: number) => void = ComProgress.bumpCallback;

	// Default NormalizedValue = ndefined
	private maxValue: number = 0.0;
	private currentValue: number = 0.0;

	get MaxValue(): number { return this.maxValue; }
	get CurrentValue(): number { return this.currentValue; }
	get NormalizedValue(): number | undefined
	{
		const result = this.currentValue / this.maxValue;
		return isNaN(result) ? undefined : result;
	}

	public SetCallback( callback: (maxValue: number, currentValue: number) => void )
	{
		this.callback = callback;
	}

	public Reset()
	{
		this.currentValue = 0.0;
		this.maxValue = 0.0;
		this.callback = ComProgress.bumpCallback;
	}

	public SetProgress( maxValue: number, currentValue: number )
	{
		this.maxValue = maxValue;
		this.currentValue = currentValue;
		this.callback( maxValue, currentValue );
	}

}


/////////////////////////////////////////////////////////////////////////////////////////
export interface ICommonResult
{
	bHasGoodResult : boolean;
	
	body : Buffer | null;
}


/////////////////////////////////////////////////////////////////////////////////////////
export interface IClientRequestResult extends ICommonResult
{

}


/////////////////////////////////////////////////////////////////////////////////////////
export interface IServerResponseResult extends ICommonResult
{

}

// Check that the port number is not NaN when coerced to a number,
// is an integer and that it falls within the legal range of port numbers.
export function IsLegalPort(port : number | string)
{
	if ((typeof port !== 'number' && typeof port !== 'string') || (typeof port === 'string' && port.trim().length === 0))
	{
		return false;
	}
	return +port === (+port >>> 0) && port <= 0xFFFF;
}


/////////////////////////////////////////////////////////////////////////////////////////
export async function HTTP_Get( URL : string, requestOptions?: https.RequestOptions ) : Promise<Buffer | null>
{
	return new Promise<Buffer | null>( ( resolve ) =>
	{
	//	const parsed = url.parse( URL );
	//	const requestOptions = <https.RequestOptions>
	//	{
	//		headers : headers,
	//		hostname : parsed.hostname,
	//		method : 'GET',
	//		path : parsed.path,
	//		port : parsed.port,
	//		protocol : "https:"
	//	};

		const request = https.get( /*requestOptions */ URL, requestOptions || {}, function( response : http.IncomingMessage )
		{
			let stream : ( zlib.Unzip | http.IncomingMessage ) = response;

			const zlibOptions = <zlib.ZlibOptions>
			{
				flush: zlib.constants.Z_SYNC_FLUSH,
				finishFlush: zlib.constants.Z_SYNC_FLUSH
			};

			switch ( response.headers['content-encoding']?.trim().toLowerCase() )
			{
				case 'gzip': case 'compress':
				{
					stream = response.pipe( zlib.createGunzip( zlibOptions ) );
					break;
				}
				case 'deflate':
				{
					stream = response.pipe( zlib.createInflate( zlibOptions ) );
					break;
				}
			}

			const buffers = new Array<Buffer>();
			let contentLength = 0;
			stream.on('data', function( chunk : Buffer )
			{
				contentLength += chunk.length;
				buffers.push( chunk );
			});

			stream.on('end', function()
			{
				const result : Buffer = Buffer.concat( buffers, contentLength );
				resolve( result );
			});

			stream.on( "error", function( err: Error )
			{
				console.error( "HTTP_Get:\t", err.name, err.message );
				resolve( null );
			})
		});

		request.on( "error", function( err: Error )
		{
			console.error( "HTTP_Get:\t", err.name, err.message );
			resolve( null );
		});

		request.end();
	})
}


/////////////////////////////////////////////////////////////////////////////////////////
export async function ResolveWithGoodResult<T extends ICommonResult>( body?: Buffer, cb?: ( value: T ) => void  ) : Promise<T>
{
	const resultObject = <T>
	{
		body : body || Buffer.from('OK'),
		bHasGoodResult : true
	}
	if ( typeof cb === 'function' )
	{
		cb( resultObject );
	}
	return resultObject
}


/////////////////////////////////////////////////////////////////////////////////////////
export async function ResolveWithError<T extends ICommonResult>( errName : string, errMessage : string | Error, cb? : (value: T) => void ) : Promise<T>
{
	//debugger;
	let msg = '';
	if ( typeof errMessage === 'string' )
	{
		msg = `${errMessage}`;
	}
	else
	{
		msg = `${errMessage.name}:${errMessage.message}`;
	}

	const resultObject = <T>
	{
		body: Buffer.from( `${errName}. ${msg}` ),
		bHasGoodResult : false
	};
	if ( typeof cb === 'function' )
	{
		cb( resultObject );
	}
	return resultObject;
}