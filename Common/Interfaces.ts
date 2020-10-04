
export enum EHeaders
{
	USERNAME = 'x-username',
	PASSWORD = 'x-password',
	TOKEN = 'x-token',

	IDENTIFIER = 'x-identifier',
	KEY = 'x-key',
}

export enum EMappedPaths
{
	USER = '/user',
	RESOURCE = '/resource',
	STORAGE = '/storage',
};


export interface ILifeCycleObject<I = any, S = boolean, L = boolean, F = any>
{
	Initialize(...args:any[]) : I | Promise<I>;
	Save(...args:any[]): S | Promise<S>;
	Load(...args:any[]): L | Promise<L>;
	Finalize(...args:any[]): F | Promise<F>;
}
