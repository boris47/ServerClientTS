

interface CustomLocalStorage
{
	Initialize(AppName: string, StorageName: string): Promise<boolean>;
	LoadStorage(): Promise<boolean>;
	SaveStorage(): Promise<boolean>;
	ClearStorage(): Promise<boolean>;
	AddResource(Key: string, data: Buffer, bForced?: boolean): Promise<boolean>;
	HasResource(Key: string): Promise<boolean>;
	ListResources(): Promise<string[]>;
	GetResource(Key: string): Promise<Buffer | null>;
	GetResources(Keys: string[]): Promise<(Buffer | null)[]>;
	RemoveResource(Key: string): Promise<boolean>;
	RemoveResources(Keys: string[]): Promise<string[]>;
}


declare const __static: string;

declare const customLocalStorage: CustomLocalStorage;

declare namespace NodeJS
{
	interface Global
	{
		__static: string;
		customLocalStorage: CustomLocalStorage;
	}
}
