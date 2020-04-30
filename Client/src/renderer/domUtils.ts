
export default class DomUtils
{

	public static ProcessInputFiles(event: Event) : File[]
	{
		console.assert( !!event, "Domutils:ProcessInputFiles: Received invalid event" );
		const results = new Array<File>();
		const inputElement = event.target as HTMLInputElement;
		if ( inputElement && inputElement.files )
		{
			for (let index = 0; index < inputElement.files.length; index++)
			{
				const element : File = inputElement.files[index];
				results.push( element )
			}
		}
		return results;
	}

	public static ProcessInputFolder(event: Event) : string | null
	{
		console.assert( !!event, "Domutils:ProcessInputFoder: Received invalid event" );
		const inputElement = event.target as HTMLInputElement;
		if ( inputElement?.files?.length > 0 )
		{
			return inputElement.files[0].path;
		}
		return null;
	}
	
}