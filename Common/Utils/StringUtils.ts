

export default class StringUtils {
	
	/** Helper function to find the nth occurrence of a character in a string
	 * @param str Source string
	 * @param substring string to search for
	 * @param nth starting index of search
	 */
	public static GetSubstringIndex( str : string, substring : string, nth : number ): number
	{
		const l = str.length;
		let i = -1;
		while( nth-- && i ++ < l )
		{
			i = str.indexOf( substring, i );
			if ( i < 0 )
			break;
		}
		return i++;
	}
	
	/**
	 * @param milliseconds 
	 */
	public static FormatTime(milliseconds: number): string
	{
		const date 			= new Date(milliseconds);
		const hoursString   = date.getUTCHours().toString().padStart(2, '0');
		const minutesString = date.getUTCMinutes().toString().padStart(2, '0');
		const secondsString = date.getUTCSeconds().toString().padStart(2, '0');
		const msString 		= date.getUTCMilliseconds().toString().padStart(4, '0');
		return `${hoursString}:${minutesString}:${secondsString}.${msString}`;
	}
}