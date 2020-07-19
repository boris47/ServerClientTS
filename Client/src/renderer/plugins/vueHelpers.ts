



export default {

	GetStatic: (resource: string): string =>
	{
		const pathToResource = `${localStorage.getItem('staticPath')}/${resource}`;
		console.log(pathToResource);
		return pathToResource;
	}
}


