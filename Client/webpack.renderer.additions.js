
//const fs = require('fs');
const isDevelopmentEnvironment = process.env.NODE_ENV == "development";


/**
 * @typedef  {import('webpack/declarations/WebpackOptions').WebpackOptions} WebpackOptions
 */

/**
 * @param config {WebpackOptions}
 */
module.exports = function(config)
{
	config.target = 'web',
	config.devtool = false;  //isDevelopmentEnvironment ?*/ "inline-source-map" //: false;
	config.performance = {
		hints : false //"error"
	};
	config.output.libraryTarget = 'var';

//	/** @param {string} key @param {any} value */
//	const replacer = ( key, value ) =>
//	{
//		if ( key === 'typescript' && typeof value === 'object' ) return undefined;
//		return value
//	};
//	fs.writeFileSync( `rendererCFG_${process.env.NODE_ENV}.json`, JSON.stringify(config, replacer, 4) );
	return config;
}