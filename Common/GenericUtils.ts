

export const DelayMS = ( ms : number )  : Promise<void> =>
{
	return new Promise<void>( ( resolve ) =>
	{
		const callback = () =>
		{
			resolve();
		}
		setTimeout( callback, ms );
	});
};