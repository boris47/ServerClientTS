
const isDevelopmentEnvironment = process.env.NODE_ENV == "development";

/**
 * @typedef  {import('webpack/declarations/WebpackOptions').WebpackOptions} WebpackOptions
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
	
	// Replace static folder of webpack devserver content base entry with resources folder name
	if (isDevelopmentEnvironment)
	{
		/** @type Array<String> */
		const contentBase = config.devServer && config.devServer['contentBase'];
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

//	/** @param {string} key @param {any} value */
//	const replacer = ( key, value ) =>
//	{
//		if ( key === 'typescript' && typeof value === 'object' ) return undefined;
//		return value
//	};
//	fs.writeFileSync( `rendererCFG_${process.env.NODE_ENV}.json`, JSON.stringify(config, replacer, 4) );
	return config;
}