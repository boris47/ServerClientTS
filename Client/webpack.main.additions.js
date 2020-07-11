
const path = require('path');
const fs = require('fs');
const isDevelopmentEnvironment = process.env.NODE_ENV == "development";

/**
 * @typedef  {import('webpack/declarations/WebpackOptions').WebpackOptions} WebpackOptions
 */

/**
 * @param config {WebpackOptions}
 */
module.exports = function(config)
{
	config.devtool = isDevelopmentEnvironment ? "inline-source-map" : false;
	config.performance = false;
//	config.entry['preload'] = path.join(__dirname, 'src', 'main', 'preload.js');

	/** @param {string} key @param {any} value */
	const replacer = ( key, value ) =>
	{
		if ( key === 'typescript' && typeof value === 'object' ) return undefined;
		return value
	};
//	fs.writeFileSync( `mainCFG_${process.env.NODE_ENV}.json`, JSON.stringify(config, /*replacer*/null, 4) );

	return config;
};