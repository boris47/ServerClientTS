

export default class ArrayUtils
{

	/** Return the same array but filtered of element not responding to given predicate
	 * @param array 
	 * @param predicate 
	 */
	public static FilterArray<T>(array: Array<T>, predicate: (element: T) => boolean): Array<T>
	{
		if (predicate)
		{
			for (let index = array.length - 1; index >= 0; index--)
			{
				const element: T = array[index];
				if (!predicate(element))
				{
					array.splice(index, 1);
				}
			}
		}
		return array;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	public static IsArrayOfType<T = any>(array: Array<T>, type: string | { new(...args: any[]): T; }): array is Array<T>
	{
		if (Array.isArray(array))
		{
			const predicate = typeof type === 'string' ? (e: any) => typeof e === type : (e: any) => e instanceof type;
			const bEveryHaveSameType = array.every(e => predicate(e));
			return array.length > 0 && bEveryHaveSameType;
		}
		return false;
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public static ArrayContainsSomeOf<T = any>(array: Array<T>, type: string | { new(...args: any[]): T; }): array is Array<T>
	{
		if (Array.isArray(array))
		{
			const predicate = typeof type === 'string' ? (e: any) => typeof e === type : (e: any) => e instanceof type;
			const bSomeHaveSameType = array.some(e => predicate(e));
			return array.length > 0 && bSomeHaveSameType;
		}
		return false;
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public static ArrayGetItemsOfType<T = any>(array: Array<T>, type: string | { new(...args: any[]): T; }): T[]
	{
		const results = new Array();
		if (Array.isArray(array))
		{
			const predicate = typeof type === 'string' ? (e: any) => typeof e === type : (e: any) => e instanceof type;
			return array.filter(predicate);
		}
		return results;
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public static ExtractFromArray<T = any>(array: Array<T>, predicate: (item: T) => boolean): T[]
	{
		const results = new Array<T>();
		if (Array.isArray(array))
		{
			for (let index = array.length - 1; index > -1; index--)
			{
				if (predicate(array[index]))
				{
					results.push(...array.splice(index, 1));
				}
			}
		}
		return results;
	}
}
