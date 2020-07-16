
/* class decorator */
export function RequireStatics<T>()
{
    return <U extends T>(constructor: U) => {constructor};
}