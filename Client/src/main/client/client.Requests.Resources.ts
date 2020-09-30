
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

import { IClientRequestInternalOptions, ClientRequestsProcessing } from "./client.Requests.Processing";
import FSUtils from '../../../../Common/Utils/FSUtils';
import * as ComUtils from '../../../../Common/Utils/ComUtils';

import * as mime from 'mime-types';
import { EHeaders } from '../../../../Common/Interfaces';

export default class ClientRequestResources
{
	/////////////////////////////////////////////////////////////////////////////////////////
	/** Client -> Server */
	public static async UploadResource( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions )
	{
		const identifier = clientRequestInternalOptions.Headers[EHeaders.IDENTIFIER] as string;
		
		// Check if file exists
		if ( fs.existsSync( identifier ) === false )
		{
			return ComUtils.ResolveWithError( "ClientRequests:UploadResource", `File ${identifier} doesn't exist` );
		}

		const filePathParsed = path.parse( identifier );
		// Headers
		{
			clientRequestInternalOptions.Headers[EHeaders.IDENTIFIER] = filePathParsed.base;
			// Check if content type can be found
			// Considering https://stackoverflow.com/a/1176031 && https://stackoverflow.com/a/12560996 but appling https://stackoverflow.com/a/28652339
			const contentType : string = mime.lookup( filePathParsed.ext ) || 'application/octet-stream';
			clientRequestInternalOptions.Headers['content-type'] = contentType;
			
			// Check file Size
			const sizeInBytes : number | null = FSUtils.GetFileSizeInBytesOf( identifier );
			if ( sizeInBytes === null )
			{
				return ComUtils.ResolveWithError( "ClientRequests:UploadResource", `Cannot obtain size of file ${identifier}` );
			}
			clientRequestInternalOptions.Headers['content-length'] = sizeInBytes.toString();
		}

		clientRequestInternalOptions.ReadStream = fs.createReadStream( identifier );

		return ClientRequestsProcessing.MakeRequest( options, clientRequestInternalOptions );
	};

	/////////////////////////////////////////////////////////////////////////////////////////
	/** Server -> Client */
	public static async DownloadResource( options: http.RequestOptions, clientRequestInternalOptions : IClientRequestInternalOptions )
	{
		const { DownloadLocation } = clientRequestInternalOptions;
		const identifier = clientRequestInternalOptions.Headers[EHeaders.IDENTIFIER] as string;

		await FSUtils.EnsureDirectoryExistence(DownloadLocation);
		const filePath = path.join( DownloadLocation, identifier );
		if ( !await FSUtils.EnsureWritableFile( filePath ) )
		{
			clientRequestInternalOptions.ComFlowManager.Progress.SetProgress( -1, 1 );
			return ComUtils.ResolveWithError( `Error`, `Client:DownloadResource: Cannot write file: ${filePath}` )
		}

		clientRequestInternalOptions.WriteStream = fs.createWriteStream( path.join( DownloadLocation, identifier ) );
		return ClientRequestsProcessing.MakeRequest( options, clientRequestInternalOptions );
	};
}