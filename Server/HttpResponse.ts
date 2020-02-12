
import http = require('http');
import { IServerResponseResult } from '../Common/Interfaces';


type responseApplyFunction = ( request : http.IncomingMessage, response : http.ServerResponse) => Promise<IServerResponseResult> 


export class HttpResponse {

	private code : number = 0;
	private body : string | Buffer = null;
	private headers : any[] = new Array<any>();
	private applyFunction : responseApplyFunction | null = null;

	constructor( code : number, body : string | Buffer, applyFunction? : responseApplyFunction | null, headers : any[] = [] )
	{
		this.headers = headers;
        this.body = body;
		this.code = code;
		this.applyFunction = applyFunction;
    }

	public async applyToResponse( request : http.IncomingMessage, response : http.ServerResponse ) : Promise<IServerResponseResult>
	{
		if ( this.applyFunction )
		{
			return await this.applyFunction( request, response );
		}
		else
		{
			response.statusCode = this.code;
			this.headers.forEach( h => response.setHeader( h.name, h.value ) );
			if (request.headers['origin'])
			{
				response.setHeader('Access-Control-Allow-Origin', request.headers['origin'])
			}
			response.end(this.body);
			return <IServerResponseResult>
			{
				bHasGoodResult : true,
				body : "OK"
			}
		}
    }

}