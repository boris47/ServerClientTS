
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as mime from 'mime-types';
import * as ComUtils from '../../../Common/Utils/ComUtils';
import { DOWNLOAD_LOCATION } from '../Server.Globals';
import FSUtils from '../../../Common/Utils/FSUtils';
import ServerResponsesProcessing, { IServerRequestInternalOptions } from './Server.Responses.Processing';
import { EHeaders } from '../../../Common/Interfaces';
import { HTTPCodes } from '../HTTP.Codes';

export default class ServerResponseResources
{
	/////////////////////////////////////////////////////////////////////////////////////////
	/** Client -> Server */
	public static async ClientToServer(request: http.IncomingMessage, response: http.ServerResponse): Promise<Buffer | Error>
	{
		// Check content Length
		if (request.headers['content-length'] === undefined)
		{
			const errMessage = `Request "${request.url}:${request.method}" missing 'content-length'`;
			ServerResponsesProcessing.EndResponseWithError( response, HTTPCodes[411], 411 );
			return ComUtils.ResolveWithError( 'ServerResponseResources.ClientToServer', errMessage );
		}

		// Execute file upload to client
		const identifier = request.headers[EHeaders.IDENTIFIER] as string;
		const token = request.headers[EHeaders.TOKEN] as string;
		const filePath = path.join(DOWNLOAD_LOCATION, token, identifier);
		await FSUtils.EnsureDirectoryExistence(path.dirname(filePath));

		const options: IServerRequestInternalOptions =
		{
			WriteStream: fs.createWriteStream(filePath),
			FilePath: filePath
		};
		const result: Buffer | Error = await ServerResponsesProcessing.HandleDownload(request, response, options);
		if (!Buffer.isBuffer(result))
		{
			fs.unlink(filePath, () => {});
		}
		return result;
	};

	/////////////////////////////////////////////////////////////////////////////////////////
	/** Server -> Client */
	public static async ServerToClient(request: http.IncomingMessage, response: http.ServerResponse): Promise<Buffer | Error>
	{
		// Execute file download server side
		const identifier = request.headers[EHeaders.IDENTIFIER] as string;
		const token = request.headers[EHeaders.TOKEN] as string;
		const filePath = path.join(DOWNLOAD_LOCATION, token, identifier);

		// Check if file exists
		if (!(await FSUtils.FileExistsAsync(filePath)))
		{
			const err = `Resource ${identifier} doesn't exist`;
			ServerResponsesProcessing.EndResponseWithError(response, err, 404);
			return ComUtils.ResolveWithError("ServerResponses:UploadResource", err);
		}

		// Check if content type can be found
		const contentType: string = mime.lookup(path.parse(filePath).ext) || 'application/octet-stream';
		
		// Check and get file Size
		const sizeInBytes: number | null = FSUtils.GetFileSizeInBytesOf(filePath);
		if (sizeInBytes === null)
		{
			const err = `Cannot obtain size of file ${filePath}`;
			ServerResponsesProcessing.EndResponseWithError(response, err, 400);
			return ComUtils.ResolveWithError("ServerResponses:UploadResource", err);
		}

		const options: IServerRequestInternalOptions =
		{
			Headers: {
				'content-type': contentType,
				'content-length': sizeInBytes
			},
			ReadStream: fs.createReadStream(filePath)
		};
		return ServerResponsesProcessing.HandleUpload(request, response, options);
	};
}