
/*
// IMPORT STAYLES
import 'material-design-icons/iconfont/material-icons.css'
import 'typeface-roboto/index.css'
*/

import Vue, { VueConstructor } from 'vue';
import GenericUtils from '../../../Common/Utils/GenericUtils';

import { ICP_RendererComs } from './icpRendererComs';
import { EComunications } from '../icpComs';

import AppRouter from './appRouter';

import GlobalLayout from './Components/Layouts/GlobalLayout.vue';


const components =
{
	install(Vue: VueConstructor<Vue>)
	{
		[
			GlobalLayout
		]
		.forEach((component) => Vue.component(component.name, component));
	}
};



async function loggerSetup()
{
	const appName = await ICP_RendererComs.Invoke<string>(EComunications.ELECTRON_PROPERTY, ['app', 'name']);
	console.log("RENDERER:", appName);

	const appPath = await ICP_RendererComs.Invoke<string | Error>(EComunications.ELECTRON_PATH, 'appData');
	console.log("renderer", appPath);

	const erss = await ICP_RendererComs.Invoke<NodeJS.ErrnoException | null>(EComunications.WRITE_FILE, './test.txt', "Ciao Mamma");
	console.log("erss", erss);

	const content = await ICP_RendererComs.Invoke<Buffer>(EComunications.READ_FILE, './test.txt');
	console.log(content.toString('utf-8'));
}

async function Initialize()
{
	if (process.env.NODE_ENV === 'development')
	{
		// this is to give Chrome Debugger time to attach to the new window
		await GenericUtils.DelayMS(1000);
	}

	// await the document to finish loading
	await new Promise((resolve) =>
	{
		document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', resolve) : resolve();
	});

	await loggerSetup();

	const electron = {
		install: (Vue: VueConstructor<Vue>) => Vue.prototype.$electron = require('electron')
	};
	Vue.use(electron);

	Vue.use(components);
	Vue.config.productionTip = false;

	/* eslint-disable no-new */
	const vueInstance = new Vue(
		{
			router: AppRouter.Initialize(),
			template: '<router-view></router-view>'
		}
	);
	vueInstance.$mount('#app');

	// notify Main that Renderer is ready
	ICP_RendererComs.Send('rendererReady', null);
}

Initialize().catch(function(error: Error)
{
	console.log(error);
	alert(error);
});

