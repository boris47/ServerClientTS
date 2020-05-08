

export class StringUtils {
	
	/** Helper function to find the nth occurrence of a character in a string
	 * @param str Source string
	 * @param substring string to search for
	 * @param nth starting index of search
	 */
	public static GetSubstringIndex( str : string, substring : string, nth : number )
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
}