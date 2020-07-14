

export default class ObjectUtils
{
	/** Iterative search for all items correctly responding to predicate inside and object
	 * * `FindAll<V>`: V is the type of searched object, return array is already casted to this
	 * 
	 * @param contextObject Object to iterate
	 * @param predicate Condition that must be satisfied for elements to search
	 * @returns The array of elements satifiend given condition
	 */
	public static FindAll<V = any>(contextObject: object, predicate: (item: V) => boolean): V[]
	{
		const objectsToInspect = new Array<any>(contextObject);
		const alreadyInspected = new Array<any>();
		const found = new Array<V>();
		while (objectsToInspect.length > 0)
		{
			const currentSelected = objectsToInspect.pop();
			if (predicate(currentSelected)) found.push(currentSelected);
			for (const value of Object.values(currentSelected))
			{
				if (value !== null // null is of type 'object', an array or object can contain a null value
					&& typeof value === 'object' // we'll search inside other obects or arrays
					&& !alreadyInspected.includes(value)) // this avoid circular reference issue
				{
					objectsToInspect.push(value);
					alreadyInspected.push(value);
				}
			}
		}
		return found;
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	public static EnumToArray<T = string>(enumObject: any): T[]
	{
		return Object.values(enumObject);
	}
}
