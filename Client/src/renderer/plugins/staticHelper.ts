

// import * as path from 'path';
// import * as url from 'url';

// see https://github.com/electron-userland/electron-webpack/issues/99#issuecomment-459251702
export function getStatic(val: string): string
{
//	return `${localStorage.getItem('staticFolderPath')}/${val}`;
	console.log(`${localStorage.getItem('staticPath')}/${val}`)
	return `${localStorage.getItem('staticPath')}/${val}`;

	// if ( process.env.NODE_ENV === 'production' )
	// {
	// 	console.log(__static, val );
	// 	return path.resolve(__static, val);
	// }

	// return url.resolve(window.location.origin, val);	
}