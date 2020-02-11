
import http = require('http');


type responseApplyFunction = ( request : http.IncomingMessage, response : http.ServerResponse) => Promise<never> 


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

	public async applyToResponse( request : http.IncomingMessage, response : http.ServerResponse )
	{
		if ( this.applyFunction )
		{
			await this.applyFunction( request, response );
		}
		else
		{
			response.statusCode = this.code;
			response.end(this.body);
		}
		
		response.statusCode = this.code;
		this.headers.forEach( h => response.setHeader( h.name, h.value ) );
		if (request.headers['origin'])
		{
			response.setHeader('Access-Control-Allow-Origin', request.headers['origin'])
		}
	//	response.setHeader('Access-Control-Allow-Credentials', 'true')
	//	response.setHeader('Access-Control-Allow-Headers', 'x-identity-key, x-identity-key-name, x-pw, x-token')
	//	response.end(this.body);
		
    }

}