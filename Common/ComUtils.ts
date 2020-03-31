
import * as http from 'http';
import * as https from 'https';
import * as zlib from 'zlib';


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

/////////////////////////////////////////////////////////////////////////////////////////
export async function HTTP_Get( URL : string, requestOptions?: https.RequestOptions ) : Promise<Buffer | null>
{
	return await new Promise<Buffer | null>( ( resolve ) =>
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
export async function ResolveWithGoodResult<T extends ICommonResult>( body : Buffer, cb? : ( value: T ) => void  ) : Promise<T>
{
	const resultObject = <T>
	{
		body : body,
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
		body: Buffer.from( `${errName}.\n${msg}` ),
		bHasGoodResult : false
	};
	if ( typeof cb === 'function' )
	{
		cb( resultObject );
	}
	return resultObject;
}