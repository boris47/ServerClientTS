
import * as MongoDB from 'mongodb';


export class MongoDatabase
{
	public readonly client : MongoDB.MongoClient = null;
	private readonly connection : MongoDB.MongoClient = null;
	private readonly database : MongoDB.Db = null;

	/////////////////////////////////////////////////////////////////////////////////////////
	public static async CreateConnection( clasterName : string, username : string, password: string, databaseName : string ) : Promise<MongoDatabase | null>
	{
		const uri = `mongodb+srv://${username}:${encodeURIComponent(password)}@cluster-${clasterName}.mongodb.net`;
		const client = new MongoDB.MongoClient( uri, <MongoDB.MongoClientOptions>
			{
				useNewUrlParser: true,

				useUnifiedTopology: true
			}
		);

		const connection : MongoDB.MongoClient | null = await client.connect().catch( ( err: MongoDB.MongoError ) =>
		{
			if ( err )
			{
				console.error( `MongoDatabase:CreateConnection: ${err.name}: ${err.message}` );
			}
			return null;
		});

		
		if ( connection )
		{
			const database : MongoDB.Db = connection.db( databaseName );
			const instance = new MongoDatabase(client, connection, database);
			return instance;
		}

		return null;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	constructor( client: MongoDB.MongoClient, connection: MongoDB.MongoClient, database: MongoDB.Db )
	{
		this.client = client;
		this.connection = connection;
		this.database = database;
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public static async Finalize( database : MongoDatabase ) : Promise<boolean>
	{
		console.log(`MongoDatabase.CloseClient:Closing ${database.database.databaseName}`);
		return new Promise<boolean>( ( resolve : ( value : boolean ) => void ) =>
		{
/*			database.client.close( false, ( error: MongoDB.MongoError, result: void ) =>
			{
				if ( error )
				{
					console.error( `MongoDatabase:CloseClient: Cannot close connection "${database.database.databaseName}"\n${error.name}:${error.message}` );
				}
				resolve( !error );
			});
*/
			database.connection.close( false, ( error: MongoDB.MongoError, result: void ) =>
			{
				if ( error )
				{
					console.error( `MongoDatabase:CloseClient: Cannot close connection "${database.database.databaseName}"\n${error.name}:${error.message}` );
				}
				console.log(`MongoDatabase.CloseClient:Database ${database.database.databaseName} ${(!error ? 'closed':`not closed because ${error}`)}`);
				resolve( !error );
			});
		});
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public GetCollection( collectionName : string ) : Promise<MongoDB.Collection<any> | null>
	{
		return new Promise<MongoDB.Collection<any> | null>( ( resolve : ( value: MongoDB.Collection<any> | null ) => void ) =>
		{
			this.database.collection( collectionName, <MongoDB.DbCollectionOptions>
				{
					strict : true
				},
				( error: MongoDB.MongoError, result: MongoDB.Collection<any> ) =>
				{
					if ( error )
					{
						console.error( `MongoDatabase:GetCollection: Cannot retrieve collection "${collectionName}"\n${error.name}:${error.message}` );
					}
					resolve( error ? null : result )
				}
			)
		});
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public AddOneToCollection( collection : MongoDB.Collection<any>, entry : any ) : Promise<boolean>
	{
		return new Promise<boolean>( ( resolve : ( value: boolean ) => void ) =>
		{
			collection.insertOne( entry,
				( error: MongoDB.MongoError, result: MongoDB.InsertOneWriteOpResult<any> ) =>
				{
					if ( error )
					{
						console.error( `MongoDatabase:AddToCollection: Cannot add to collection "${collection.collectionName}\n${JSON.stringify( entry, null, 4 )}"\n${error.name}:${error.message}` );
					}
					resolve( !!error );
				}
			)
		});
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public AddMoreToCollection( collection : MongoDB.Collection<any>, entries : any[] ) : Promise<boolean>
	{
		return new Promise<boolean>( ( resolve : ( value: boolean ) => void ) =>
		{
			collection.insertMany( entries,
				( error: MongoDB.MongoError, result: MongoDB.InsertWriteOpResult<any> ) =>
				{
					if ( error )
					{
						console.error( `MongoDatabase:AddMoreToCollection: Cannot add to collection "${collection.collectionName}\n${JSON.stringify( entries, null, 4 )}"\n${error.name}:${error.message}` );
					}
					resolve( !!error );
				}
			)
		});
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public UpdateOneInCollection( collection : MongoDB.Collection<any>, filterKey: string, filterValue: string, newValue : any ) : Promise<boolean>
	{
		const searchFilter =
		{
			[filterKey] : filterValue
		};
		return new Promise<boolean>( ( resolve : ( value: boolean ) => void ) =>
		{
			collection.updateOne( searchFilter, newValue,
				( error: MongoDB.MongoError, result : MongoDB.UpdateWriteOpResult ) =>
				{
					if ( error )
					{
						console.error( `MongoDatabase:UpdateOneInCollection: Cannot update in collection "${collection.collectionName} with filter\n${JSON.stringify( searchFilter, null, 4 )}"\n${error.name}:${error.message}` );
					}
					resolve( !!error && result.result.n === 1 );
				}
			)
		});
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public FindInCollection( collection : MongoDB.Collection<any>, filterKey: string, filterValue: string ) : Promise<any | null>
	{
		const searchFilter =
		{
			[filterKey] : filterValue
		};
		return new Promise<boolean>( ( resolve : ( value: boolean ) => void ) =>
		{
			collection.findOne( searchFilter,
				( error: MongoDB.MongoError, result : any ) =>
				{
					if ( error )
					{
						console.error( `MongoDatabase:FindInCollection: Cannot find in collection "${collection.collectionName} with filter \n${JSON.stringify( searchFilter, null, 4 )}"\n${error.name}:${error.message}` );
					}
					resolve( !error ? result : null );
				}
			)
		});
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public RemoveFromCollection( collection : MongoDB.Collection<any>, filterKey: string, filterValue: string ) : Promise<boolean>
	{
		const searchFilter =
		{
			[filterKey] : filterValue
		};
		return new Promise<boolean>( ( resolve : ( value: boolean ) => void ) =>
		{
			collection.deleteOne( searchFilter,
				( error: MongoDB.MongoError, result : MongoDB.DeleteWriteOpResultObject ) =>
				{
					if ( error )
					{
						console.error( `MongoDatabase:RemoveFromCollection: Cannot remove from collection "${collection.collectionName} with filter\n${JSON.stringify( searchFilter, null, 4 )}"\n${error.name}:${error.message}` );
					}
					resolve( !error );
				}
			)
		});
	}


}
