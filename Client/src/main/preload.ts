
// Script loaded by the preload attribute of the browser window
const nodeRequire = require;

// In development mode we need the require function to get hot reload to work
window.require = <any>((requiredModule: string) =>
{
	console.log(`Required module "${ requiredModule }" (${ typeof (requiredModule) })`);
	
	const allowedModules = ['module', 'source-map-support/source-map-support.js', 'vue-router', 'electron' ];
	if (!allowedModules.includes(requiredModule))
	{
		new Error(`Tried to require unknown module: ${ requiredModule }`);
	}
	else
	{
		return nodeRequire(requiredModule);
	}

/*	switch(requiredModule)
	{
		case 'module': return nodeRequire('module');
		case "source-map-support/source-map-support.js": return nodeRequire("source-map-support/source-map-support.js");
		case 'vue-router': return nodeRequire('vue-router');
		case 'electron': return nodeRequire('electron');
		default: new Error(`Tried to require unknown module: ${ requiredModule }`);
	}
*/
});

// Make a module available
window.module = {
	exports: {},
	require: window.require,
	id: "preload-module",
	filename: __filename,
	loaded: true,
	parent: null,
	children: [],
	paths: []
};