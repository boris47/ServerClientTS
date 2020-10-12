
import Vue from 'vue';
import LoginManager from './plugins/loginManager';
import VueRouter, { Route, RouterOptions, RawLocation } from 'vue-router';

//import HomePage from "./Pages/HomePage.vue";
import TestPage from "./Pages/TestPage.vue";
import RegistrationPage from "./Pages/RegistrationPage.vue";
//import LoginPage from "./Pages/LoginPage.vue";
import AboutPage from "./Pages/AboutPage.vue";

// requiresAuth
import MainPage from "./Pages/RequiresAuth/MainPage.vue";
import EntrancePage from "./Pages/RequiresAuth/EntrancePage.vue";


export const RouterMap =
{
	'loginPage': {},
	'registrationPage': {},
	'testPage' : {},
	'mainPage' : {
		'entrancePage': {}
	},
	'aboutPage': {}
}


export default class AppRouter
{
	private static instance: VueRouter = null;
	private static isInitialized: boolean = false;

	public static Initialize()
	{
		if (!AppRouter.isInitialized)
		{
			AppRouter.isInitialized = true;
			const routerOptions = <RouterOptions>
				{
					routes: [
						{
							path: '/loginPage',
							name: 'loginPage',
							component: () => import('./Pages/LoginPage.vue')
						},
						{
							path: '/RegistrationPage',
							name: 'registrationPage',
							component: RegistrationPage
						},
						{
							path: '/testPage',
							name: 'testPage',
							component: TestPage,
							meta: { requiresAuth: true },
						},
						{
							path: '/mainPage',
							name: 'mainPage',
							component: MainPage,
							meta: { requiresAuth: true },
							children: [
								{
									path: 'entrancePage', name: 'entrancePage', component: EntrancePage
								}
							]
						},
						{
							path: '/aboutPage',
							name: 'aboutPage',
							component: AboutPage
						},

						// Fallback to avoid 404 error
						{ path: '*', redirect: { path: '/loginPage' } }
					]
				};

			const vueRouterInstance = new VueRouter(routerOptions);
			Vue.use(VueRouter);

			/**
			 * 
			 */
			vueRouterInstance.beforeResolve((to: Route, from: Route, next: (to?: RawLocation | false | ((vm: Vue) => any) | void) => void) =>
			{
				let result: false | undefined = undefined; // green light
				if (to)
				{
					if (to.fullPath == from.fullPath)  // same path, red light
					{
						result = false;
						console.warn(`AppRouter:beforeResolve: From '${from.fullPath}' -> '${to.fullPath}' : ${result}`);
					}
				}

				/**
				 * result : undefined -> green light
				 * result : false -> red light
				 */
				next(result);
			});

			/**
			 * 
			 */
			vueRouterInstance.beforeEach((to: Route, from: Route, next: (to?: RawLocation | false | ((vm: Vue) => any) | void) => void) =>
			{
				let result: RawLocation | undefined = undefined;  // green light
				const authenticationRequired: boolean = to.matched.some(route => route.meta && route.meta.requiresAuth);
				if (authenticationRequired && !LoginManager.IsLoggedIn) // Login required, red light
				{
					result = <RawLocation> { path: '/loginPage', query: { redirect: to.fullPath } };
					console.log(`AppRouter:beforeEach: From '${from.fullPath}' -> '${to.fullPath}' : ${result}`);
				}

				/**
				 * result : undefined -> green light
				 * result : false -> red light
				 * result : object -> redirect to login, after login redirect to previous searched path
				 */
				next(result);
			});

			AppRouter.instance = vueRouterInstance;
		}
		return AppRouter.instance;
	}


	///
	public static NavigateTo(name: string)
	{
		console.log(`AppRouter:NavigateTo: Going to ${name}`);
		if ( AppRouter.instance.currentRoute.name !== name )
		{
			AppRouter.instance.push({ name: name });
		}
	}
}
