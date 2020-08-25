

import { UniqueID, ITemplatedObject, CustomCrypto, Yieldable } from "../../../Common/Utils/GenericUtils";


export class UserLoginData
{
	private token: null | string = null;
//	private loggedInTime: number = 0;
	private loginDate: null | Date = null;
	private logoutDate: null | Date = null;

	//
	get Token(): null | string { return this.token; };
//	get LoggedInTime() : number { return this.loggedInTime; };
	get LoginDate() : Date { return this.loginDate; };
	get LogoutDate() : Date { return this.logoutDate; };


	//
	public Login( token?: string )
	{
		this.loginDate = new Date;
//		this.loggedInTime = 0;
		this.logoutDate = null;
		this.token = token || UniqueID.Generate();
	}

	//
	public LogOut()
	{
		this.loginDate = null;
//		this.loggedInTime = Date.now() - this.loginDate.getUTCMilliseconds()
		this.logoutDate = new Date;
		this.token = null;
	}
};

export interface IServerUserBaseProps
{
	readonly	username: string;
	readonly	password: string;
	readonly	id?: string;
}

export class ServerUser implements IServerUserBaseProps
{
//	private static passPhrase32Bit : string = `NEhS@qDBXrmq2qyNe4WUS7Lb+Y=5-gC3`;
//	private static iv: string = '7}t;Ca5R&nT{8>RE';
//	private static users: ServerUser[] = new Array<ServerUser>();

//	public static async GetUserByToken(token: string): Promise<ServerUser | null>
//	{
//		return ServerUser.users.find( u => u.LoginToken === token ) || null;
/*
		let userFound = null;
		for( const user of ServerUser.users )
		{
			await Yieldable( () => userFound = ( user.loginData?.Token === token ) ? user : null );
		}
		return userFound;*/
//	}

/*	public static EncryptData( username: string, password: string, id?: string ): IServerUserBaseProps
	{
		return {
			username: CustomCrypto.Encrypt( username, ServerUser.passPhrase32Bit, ServerUser.iv ),
			password: CustomCrypto.Encrypt( password, ServerUser.passPhrase32Bit, ServerUser.iv ),
			id: id ? CustomCrypto.Encrypt( id, ServerUser.passPhrase32Bit, ServerUser.iv ) : undefined,
		};
	}

	public static DecryptData( username: string, password: string, id?: string ): IServerUserBaseProps
	{
		return {
			username: CustomCrypto.Decrypt( username, ServerUser.passPhrase32Bit, ServerUser.iv ),
			password: CustomCrypto.Decrypt( password, ServerUser.passPhrase32Bit, ServerUser.iv ),
			id: id ? CustomCrypto.Decrypt( id, ServerUser.passPhrase32Bit, ServerUser.iv ) : undefined,
		}
	}
*/
	///////////////////////////////////////////////////////////////////////////////////////////////////

	public	readonly	username: string			= '';
	public 	readonly	password: string 			= '';
	public	readonly	id: string					= UniqueID.Generate();
	private readonly	loginData: UserLoginData	= new UserLoginData;

	//
	get LoginToken(): string { return this.loginData.Token; };


	//
	public static Load( userData: Object ): ServerUser
	{
		const { username, password, id, loginData: {token} } = userData as IServerUserBaseProps & { loginData: { token: string } };
		const newUser = new ServerUser( username, password, id );
		if (token)
		{
			newUser.Login(token);
		}

		return newUser;
	}

	//
	constructor( username?: string, password?: string, id?: string )
	{
		this.username = username ?? this.username;
		this.password = password ?? this.password;
		this.id = id ?? this.id;
//		ServerUser.users.push(this);
	}


	//
	public Login(token?: string): void
	{
		this.loginData.Login(token);
	}

	//
	public IsPassword( password: string )
	{
		return this.password === password;
	}

	//
	public async Logout()
	{
		this.loginData.LogOut();
		// TODO Release every data left outside
	}


	protected toJSON()
	{
		const toSkip : string[] = [];// ['loginData'];
		const output : ITemplatedObject = {};
		for ( const prop in this )
		{
			output[prop] = toSkip.includes(prop) ? undefined : this[prop];
		}
		return output;
	}
}