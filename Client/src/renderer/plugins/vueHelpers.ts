
import { PluginObject, VueConstructor } from "vue";

const methods =
{
	GetStatic: (resource: string): string =>
	{
		const pathToResource = `${localStorage.getItem('staticPath')}/${resource}`;
		console.log(`GetStatic:Path '${pathToResource}'`);
		return pathToResource;
	}
}

export const VueHelperPlugin : PluginObject<Vue> = 
{
	install: (Vue: VueConstructor<Vue>, options?: Vue) =>
	{
	//	Vue.helpers = StaticHelpers
		for( const [name, func] of Object.entries(methods) )
		{
			Vue.prototype[name] = func;
		}
	}
};

export default VueHelperPlugin;