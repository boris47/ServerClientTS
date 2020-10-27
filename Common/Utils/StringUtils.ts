

export default class StringUtils
{
	private static K = 1024;
	private static M = StringUtils.K * StringUtils.K;
	private static G = StringUtils.M * StringUtils.K;
	private static T = StringUtils.G * StringUtils.K;
	private static dividers = [ StringUtils.T, StringUtils.G, StringUtils.M, StringUtils.K, 1 ];
	private static units = [ "TB", "GB", "MB", "KB", "B" ];


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

	/**
	 * @param bytes 
	 * @see https://stackoverflow.com/a/3758653
	 */
	public static FormatSpeedFromBytes( bytes: number ): string
	{
		if(bytes < 0)
		{
			return `GenericUtils.FormatSpeedFromBytes: Invalid Argument '${bytes}'`;
		}

		const dividerIndex: number = StringUtils.dividers.findIndex( divider => bytes > divider );
		const divider: number = StringUtils.dividers[dividerIndex];
		const unit: string = StringUtils.units[dividerIndex];

		// result = divider > 1 ? (double) value / (double) divider : (double) value;
		// return new DecimalFormat("#,##0.#").format(result) + " " + unit;
		
		const result = divider > 1 ? (bytes / divider) : bytes;
		return `${result.toFixed(0)} ${unit}/s`;
	}
}