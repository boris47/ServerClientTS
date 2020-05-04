
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
	config.devtool = isDevelopmentEnvironment ? config.devtool : false;
//	const isDev = (process.env.NODE_ENV === 'development');
//	fs.writeFileSync( `mainCFG_${process.env.NODE_ENV}.json`, JSON.stringify(config, null, 4) );
	// \dist\main\Preload.js
	config.entry['preload'] = path.join(__dirname, 'src', 'main', 'preload.js');

	return config;
};