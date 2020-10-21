
import * as http from 'http';
import * as https from 'https';
import * as zlib from 'zlib';
import { UniqueID } from './GenericUtils';


/////////////////////////////////////////////////////////////////////////////////////////
enum EComFlowTags
{
	// Progress
	PROGRESS_VALUE 	= 'PROGRESS_VALUE',
	PROGRESS_LABEL 	= 'PROGRESS_LABEL',
	CLOSE_LABEL 	= 'CLOSE_LABEL',
}

//
export class ComFlowManager
{
	/** Add tag for channel used for progress data transmission */
	public static readonly ToProgressValueId 	= ( baseId: string ) => `${baseId}_${EComFlowTags.PROGRESS_VALUE}`;
	public static readonly ToProgressLabelId 	= ( baseId: string ) => `${baseId}_${EComFlowTags.PROGRESS_LABEL}`;
	public static readonly ToUnregisterId 		= ( baseId: string ) => `${baseId}_${EComFlowTags.CLOSE_LABEL}`;

	//
	private readonly id: string = UniqueID.Generate();

	private readonly progress : ComProgress = new ComProgress();

	private tag: string = '';

	//
	get Id(): string
	{
		return this.id;
	}

	get Progress() : ComProgress
	{
		return this.progress;
	}

	get Tag(): string
	{
		return this.tag;
	}

	constructor(tag: string)
	{
		this.tag = tag;
	}
}

type newValueCallbackType = (maxValue: number, currentValue: number) => void;
type newLabelCallbackType = (label: string) => void;

//
export class ComProgress
{
	private newValueCallback : newValueCallbackType = () => {};
	private newLabelCallback : newLabelCallbackType = () => {};

	// Default NormalizedValue = ndefined
	private maxValue: number = 0.0;
	private currentValue: number = 0.0;
	private label: string | null = null;

	get Label(): string | null { return this.label; }
	get MaxValue(): number { return this.maxValue; }
	get CurrentValue(): number { return this.currentValue; }
	get NormalizedValue(): number | undefined
	{
		const result = this.currentValue / this.maxValue;
		return isNaN(result) ? undefined : result;
	}

	public SetCallback( newValueCallback: newValueCallbackType, newLabelCallback: newLabelCallbackType )
	{
		this.newValueCallback = newValueCallback;
		this.newLabelCallback = newLabelCallback
	}

	public Reset()
	{
		this.newValueCallback = () => {};
		this.label = null;
		this.currentValue = 0.0;
		this.maxValue = 0.0;
	}

	public SetProgress( maxValue: number, currentValue: number )
	{
		this.maxValue = maxValue;
		this.currentValue = currentValue;
		this.newValueCallback( maxValue, currentValue );
	}

	public SetLabel(newLabel: string)
	{
		this.label = newLabel;
		this.newLabelCallback( this.label );
	}

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
export async function ResolveWithGoodResult( body?: Buffer, cb?: ( value: Buffer ) => void  ) : Promise<Buffer>
{
	const resultObject = body || Buffer.from('OK');
	if ( typeof cb === 'function' )
	{
		cb( resultObject );
	}
	return resultObject
}


function CallerFilePath()
{
	/* DEBUG PURPOSE */
//	/*
	const stack =  new Error().stack;
	const splitted = stack.split('\n');
	const filtered = splitted.filter( s => s.includes('.ts:') )
	.slice(1); // remove this function call
	const joined = filtered.join('\n');
	return joined;
//	*/
//	return new Error().stack.split('\n').filter( s => s.includes('.ts:') ).slice(1).join('\n');
}


/////////////////////////////////////////////////////////////////////////////////////////
export async function ResolveWithError( errName : string, errMessage : string | Error, cb? : (value: Error) => void ) : Promise<Error>
{
	const issuer = CallerFilePath();

//	debugger;
	const msg = typeof errMessage === 'string' ? `${errMessage}` : `${errMessage.name}:${errMessage.message}`;
	const err = new Error( `${errName}: ${msg}\n${issuer}` );
	if ( typeof cb === 'function' )
	{
		cb( err );
	}
	return err;
}