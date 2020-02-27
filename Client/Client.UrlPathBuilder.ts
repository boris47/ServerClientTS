

export class Client_UrlPathBuilder
{
	private baseURL : string = '';
	private bHasMarkerAdded = false;

	constructor( BaseURL : string | null | undefined )
	{
		this.baseURL = BaseURL || '';
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	private CheckMarker() : string
	{
		if ( !this.bHasMarkerAdded )
		{
			this.bHasMarkerAdded = true;
			this.baseURL += '?';
		}
		return this.baseURL += '&';
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public Get()
	{
		return this.baseURL;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public AddKeyValue( Key : string, Value : string ) : Client_UrlPathBuilder
	{
		this.baseURL = this.CheckMarker() + `${Key}=${Value}`;
		return this;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public AddSwitch( Switch : string ) : Client_UrlPathBuilder
	{
		this.baseURL = this.CheckMarker() + `${Switch}`;
		return this;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public AddArray( ArrayName : string, Values : string[] ) : Client_UrlPathBuilder
	{
		this.baseURL = this.CheckMarker() + `${ArrayName}=["${Values.join( '-' )}"]`;
		return this;
	}

}