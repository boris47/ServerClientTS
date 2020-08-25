
/*
// IMPORT STAYLES
import 'material-design-icons/iconfont/material-icons.css'
import 'typeface-roboto/index.css'
*/

import GenericUtils from '../../../Common/Utils/GenericUtils';


// Electron Stuff
import { ipcRenderer } from 'electron';
import { ICP_RendererComs } from './icpRendererComs';
import { EComunicationsChannels } from '../icpComs';

// Vue
import Vue, { VueConstructor, PluginObject } from 'vue';

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
	// localStorage Setup
	{		
		localStorage.setItem('isDev', String(bIsDev));

		const resourcePath = await ICP_RendererComs.Invoke( EComunicationsChannels.RESOURCE_PATH, null, null );
		localStorage.setItem('staticPath',bIsDev ? window.location.origin : `${resourcePath}/app.asar/static` );
	}

	if (process.env.NODE_ENV === 'development')
	{
		// this is to give Chrome Debugger time to attach to the new window
		await GenericUtils.DelayMS(1000);
	}

	// await the document to finish loading
	await new Promise((resolve) => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', resolve) : resolve() );

	// Setup Vue
	Vue.use(components);
	Vue.use(VueHelperPlugin);
	Vue.config.productionTip = false;

	const vueInstance = new Vue(
		{
			router: AppRouter.Initialize(),
			template: '<router-view></router-view>'
		}
	);
	vueInstance.$mount('#app');

	// notify Main that Renderer is ready
	ipcRenderer.send('rendererReady', null);
}

Initialize().catch(function(error: Error)
{
	console.log(error);
	alert(error);
});

