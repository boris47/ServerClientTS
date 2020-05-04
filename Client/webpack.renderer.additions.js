
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
	/*
		stats: {
			warningsFilter: [/critical dependency:/i],
		}
	*/
	config.devtool = isDevelopmentEnvironment ? config.devtool : false;
//	const isDev = (process.env.NODE_ENV === 'development');
//	fs.writeFileSync( `rendererCFG_${process.env.NODE_ENV}.json`, JSON.stringify(config, null, 4) );
	config.target = "web";
	return config;
}