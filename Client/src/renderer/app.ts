
/*
// IMPORT STAYLES
import 'material-design-icons/iconfont/material-icons.css'
import 'typeface-roboto/index.css'
*/

import Vue, { VueConstructor } from 'vue';
import GenericUtils from '../../../Common/Utils/GenericUtils';

import { ICP_RendererComs } from './icpRendererComs';

import AppRouter from './appRouter';

import GlobalLayout from './Components/Layouts/GlobalLayout.vue';
import InputSelector from './Components/InputSelector.vue';



const components =
{
	install(Vue: VueConstructor<Vue>)
	{
		[
			GlobalLayout,
			InputSelector
		]
		.forEach((component) =>
		{
			Vue.component(component.name, component)
			console.log("Registered", component.name);
		});
	}
}; 


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


	const electronAsPlugin = {
		install: (Vue: VueConstructor<Vue>) => Vue.prototype.$electron = require('electron')
	};
	Vue.use(electronAsPlugin);
	Vue.use(components);
	Vue.config.productionTip = false;
	Vue.prototype.$sync = function( key: string, value: any )
	{
		this.$emit(`update:${key}`, value);
	};

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

