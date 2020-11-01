
/*
// IMPORT STAYLES
import 'material-design-icons/iconfont/material-icons.css'
import 'typeface-roboto/index.css'
*/


// Electron Stuff
import { ICP_RendererComs } from './icpRendererComs';
import { EComunicationsChannels } from '../icpComs';

// Vue
import Vue, { VueConstructor, PluginObject, CreateElement, RenderContext } from 'vue';

// Vue Router
import AppRouter from './appRouter';

// Vue Components
import GlobalLayout from './Components/Layouts/GlobalLayout.vue';
import InputSelector from './Components/InputSelector.vue';
import ProgressBar from './components/Progress/ProgressBar.vue';
import ProgressSpinner from './components/Progress/ProgressSpinner.vue';
import CustomTable from './components/Table/CustomTable.vue';
import CustomTableTd from './components/Table/CustomTableTd.vue';
import CustomButton from './components/CustomButton.vue';
import CustomSelect from './components/CustomSelect.vue';
import CustomDatalist from './components/CustomDatalist.vue';

// Vue Plugins
import VueHelperPlugin from './plugins/vueHelpers';

const bIsDev = process.env.NODE_ENV === 'development';
const components : PluginObject<Vue> =
{
	install: (Vue: VueConstructor<Vue>, options?: Vue) =>
	{
		[
			GlobalLayout,
			InputSelector,
			ProgressBar, ProgressSpinner,
			CustomTableTd, CustomTable,
			CustomButton,
			CustomSelect,
			CustomDatalist,
		]
		.forEach((component) =>
		{
			Vue.component(component.name, component)
			console.log(`Registered "${component.name}"`);
		});
	}
};


async function Initialize()
{
	if (!ICP_RendererComs.IsValid())
	{
		return Promise.reject('ICP_RendererComs not available');
	}

	// localStorage Setup
	{
		localStorage.setItem('isDev', bIsDev ? 'true' : '');
		
		const resourcePath = await ICP_RendererComs.Request( EComunicationsChannels.RESOURCE_PATH );
		localStorage.setItem('staticPath',bIsDev ? resourcePath : `${resourcePath}/resources` );
	}

	// await the document to finish loading
	await new Promise( resolve => document.readyState === 'loading' ? document.addEventListener( 'DOMContentLoaded', resolve ) : resolve() );

	// Register context menu callback
	window.addEventListener('contextmenu', ( e: MouseEvent ) =>
	{
		e.preventDefault();
		ICP_RendererComs.Notify('context-menu', e.x, e.y);
	}, false);

	// notify Main that Renderer is ready
	ICP_RendererComs.Notify('rendererReady');

	// Setup Vue
	Vue.use(components);
	Vue.use(VueHelperPlugin);
	Vue.config.productionTip = false;

	const vueInstance = new Vue(
	{
		router: AppRouter.Initialize(),
		render: ( createElement: CreateElement, hack: RenderContext<Record<never, any>> ) => createElement('router-view')
	});
	vueInstance.$mount('#app');
	return 0;
}

Initialize().catch(function( error: Error )
{
	alert(error)
	close();
});

