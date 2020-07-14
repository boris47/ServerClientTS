

import { UniqueID, ITemplatedObject } from "../../../Common/Utils/GenericUtils";

export class UserLoginData
{
	private token: null | string = null;
	private loggedInTime: number = 0;
	private loginDate: null | Date = null;
	private logoutDate: null | Date = null;

	//
	get Token(): null | string { return this.token; };
	get LoggedInTime() : number { return this.loggedInTime; };
	get LoginDate() : Date { return this.loginDate; };
	get LogoutDate() : Date { return this.logoutDate; };


	//
	public Login( token?:string )
	{
		this.loginDate = new Date;
		this.loggedInTime = 0;
		this.logoutDate = null;
		this.token = token || UniqueID.Generate();
	}

	//
	public LogOut()
	{
		this.loginDate = null;
		this.loggedInTime = Date.now() - this.loginDate.getUTCMilliseconds()
		this.logoutDate = new Date;
		this.token = null;
	}
};


export class ServerUser
{
	private static users: ServerUser[] = new Array<ServerUser>();
	public static async  GetUserById(userid: string): Promise<ServerUser| null>
	{
		return ServerUser.users.find( u => u.id === userid ) || null;
	}

	public static async GetUserByToken(token: string): Promise<ServerUser | null>
	{
		return ServerUser.users.find( u => u.loginData?.Token === token ) || null;
	}

	///////////////////////////////////////////////////////////////////////////////////////////////////

	private	readonly	username: string			= '';
	private readonly	password: string 			= '';
	private readonly	id: string					= UniqueID.Generate();
	private readonly	loginData: UserLoginData	= new UserLoginData;	

	//
	get ID() : string { return this.id };
	get Username() : string { return this.username };
//	get Password() : string { return this.password };
	get LoginData(): UserLoginData { return this.loginData };

	//
	constructor( username?: string, password?: string, id?: string )
	{
		this.username = username;
		this.password = password;
		this.id = id || this.id;

		ServerUser.users.push(this);
	}

	//
	public async Login(token?: string): Promise<void>
	{
		this.LoginData.Login(token);
	}

	//
	public IsPassword( password: string )
	{
		return this.password === password;
	}

	//
	public async Logout()
	{
		this.LoginData.LogOut();
		// TODO Release every data left outside
	}


	private toJSON()
	{
		const toSkip : string[] = ['loginData'];
		const output : ITemplatedObject = {};
		for ( const prop in this )
		{
			output[prop] = toSkip.includes(prop) ? undefined : this[prop];
		}
		return output;
	}
}