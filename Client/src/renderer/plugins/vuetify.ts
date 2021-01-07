
import Vue from 'vue';
import { UserVuetifyPreset } from 'vuetify';
import Vuetify from 'vuetify/lib';
import 'vuetify/dist/vuetify.min.css';
import * as allVuetifyComponents from 'vuetify/lib';
import '@mdi/font/css/materialdesignicons.css';
for (const [key, value] of Object.entries(allVuetifyComponents) )
{
	const name: string = (<any>value).name;
	if ( name ) key; value;
	{
		if ( name === undefined || name === 'Vuetify' ) continue;
		if ( name === 'VueComponent' )
		{
			Vue.component( key, value );
		//	console.log(`Vuetify Registered "${key}"`);
			continue;
		}
		if (name.includes('-'))
		{
			Vue.component( name, value) ;
		//	console.log(`Vuetify Registered "${name}"`);
		}
	}
}

Vue.use(Vuetify);

const opts: Partial<UserVuetifyPreset> =
{
	theme: {
		themes: {
			dark: {
				primary: "#4682b4",
				secondary: "#b0bec5",
				accent: "#8c9eff",
				error: "#b71c1c",
			},
		},
	},
	icons: {
		iconfont: 'mdi',
	},
};

export default new Vuetify(opts);