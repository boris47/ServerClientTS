
/** Class Decorator */
export function RequireStatics<T>()
{
    return <U extends T>(constructor: U) => {constructor};
};



/** Method Decorator */
export function enumerable(value: boolean)
{
	return function( target: any, propertyKey: string, descriptor: PropertyDescriptor)
	{
		descriptor.enumerable = value;
		console.log(descriptor);
	};
};