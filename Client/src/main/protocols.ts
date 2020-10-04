import * as path from 'path';
import * as urlModule from 'url';
import * as fs from 'fs';
import * as electron from 'electron';

export default class MainProcessProtocols
{
	public static RegisterProtocols(Scheme: string): void
	{
		MainProcessProtocols.RegisterFileProtocol;//(Scheme);
	}

	private static FileProtocolCache: {[key:string]:any} = {}
	private static RegisterFileProtocol(Scheme: string)
	{
		function resolvePath(filepath:string, defaultPath:string): string
		{
			let stat:fs.Stats;
			try
			{
				fs.accessSync(filepath);
				stat = fs.statSync(filepath);
			}
			catch (e)
			{
				// file doesn't exist or isn't accessible
				return defaultPath;
			}
			
			if (stat.isFile())
			{
				return filepath;
			}
			else if (stat.isDirectory())
			{
				// It's a directory, so look for an 'index.html' inside it
				return resolvePath(path.join(filepath, 'index.html'), defaultPath);
			}
			else
			{
				// Not a file or directory, so we don't really know how to handle it
				return defaultPath;
			}
		}

		const endPoint = 'dist', cwd = 'dist';
		electron.protocol.registerFileProtocol(
		Scheme,
		(request: electron.Request, callback: (filePath?: (string) | (electron.FilePathWithHeaders)) => void)  =>
		{
			const {url}= request;
			let { host, pathname } = urlModule.parse(url);
			pathname = pathname || '';
	
			if (host !== endPoint)
			{
				console.error( `Unrecognized ${name}:// endpoint: '${host}'` );
				return;
			}
	
			const pathSegments = pathname.split('/').filter(segment => segment !== '');
			const filepath = path.join(cwd, ...pathSegments);
			// Basic request caching
			this.FileProtocolCache[url] = this.FileProtocolCache[url] || resolvePath(filepath, 'index.html');
			callback({ path: this.FileProtocolCache[url] });
		},
		(error: Error) =>
		{
			if (error)
			{
				console.error(`Failed to register ${Scheme} protocol`, error);
			}
		});
	}
}