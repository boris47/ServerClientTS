//const fs = require('fs');
const isDevelopmentEnvironment = process.env.NODE_ENV == "development";


/**
 * @typedef  {import('webpack/declarations/WebpackOptions').WebpackOptions} WebpackOptions
 */

/**
 * @typedef  {import('html-webpack-plugin/typings').Options} HtmlWebpackPluginOptions
 */

/** @param config {WebpackOptions} */
module.exports = function(config)
{
	config.target = 'web',
	config.devtool = false;  //isDevelopmentEnvironment ?*/ "inline-source-map" //: false;
	config.performance = {
		hints : false //"error"
	};
	config.output.libraryTarget = 'var';
	config.plugins = config.plugins.filter(plugin => plugin.constructor.name !== 'BannerPlugin');

	/** @type Array<String> */
	const contentBase = config.devServer && config.devServer['contentBase'];

	// Replace static folder of webpack devserver content base entry with resources folder name
	if (Array.isArray(contentBase))
	{
		const index = contentBase.findIndex( line => line.endsWith('static') );
		if (index >= 0)
		{
			contentBase[index] = contentBase[index].replace('static', 'resources');
		}
		else
		{
			console.error('Cannot replace static folder path');
		}
	}


	/** @type import('webpack/declarations/WebpackOptions').WebpackPluginInstance */
//	const template = config.plugins.find(plugin => plugin.constructor.name === 'HtmlWebpackPlugin');
	
	/** @type String */
//	const tempalteFileString = template['options']['template'];
//	const templateFilePath = tempalteFileString.substring(tempalteFileString.lastIndexOf('!')+1);

//	/** @param {string} key @param {any} value */
//	const replacer = ( key, value ) =>
//	{
//		if ( key === 'typescript' && typeof value === 'object' ) return undefined;
//		return value
//	};
//	fs.writeFileSync( `rendererCFG_${process.env.NODE_ENV}.json`, JSON.stringify(config, replacer, 4) );
	return config;
}