
import http = require('http');
import { HTTPCodes } from './HTTP.Codes';
import { IServerResponseResult } from '../Common/ComUtils';




export class HttpResponse
{
	protected code : number = 0;
	protected body : string | Buffer = null;
	private headers : any[] = new Array<any>();

	constructor( code : number, body : string | Buffer, headers : any[] = [] )
	{
		this.headers = headers;
        this.body = body;
		this.code = code;
    }

	public async applyToResponse( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<IServerResponseResult>
	{
		response.statusCode = this.code;
		this.headers.forEach( h => response.setHeader( h.name, h.value ) );
		if ( request.headers['origin'] )
		{
			response.setHeader( 'Access-Control-Allow-Origin', request.headers['origin'] );
		}
		response.end(this.body);
		return <IServerResponseResult>
		{
			bHasGoodResult : this.code === 200,
			body : Buffer.from( HTTPCodes[this.code ] )
		};
    }

}

export class AsyncHttpResponse
{
	private asyncFunction : ( request : http.IncomingMessage, response : http.ServerResponse ) => Promise<IServerResponseResult> = null;

	constructor( asyncFunction : ( request : http.IncomingMessage, response : http.ServerResponse ) => Promise<IServerResponseResult>, headers : any[] = [] )
	{
		this.asyncFunction = asyncFunction;
    }

	public async applyToResponse( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<IServerResponseResult>
	{
		return this.asyncFunction( request, response );
    }
	
}