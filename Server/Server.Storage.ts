
export class ServerStorage {


	private static m_Storage : Map<string, any> = new Map<string, any>();


	public static async Load() : Promise<void>
	{
		// Load storage file
	}


	public static AddEntry( key : string, data : any, bForced : boolean = false ) : void
	{
		const bAlreadyExists = this.m_Storage.has( key );
		if ( !bAlreadyExists || bForced )
		{
			this.m_Storage.set( key, data );
		}
	}


	public static RemoveEntry( key :  string ) : void
	{
		const bExists = this.m_Storage.has( key );
		if ( bExists )
		{
			this.m_Storage.delete( key );
		}
	}


	public static HasEntry( key : string ) : boolean
	{
		return this.m_Storage.has( key );
	}

	
	public static GetEntry( key : string ) : any | undefined
	{
		return this.m_Storage.get( key );
	}

}