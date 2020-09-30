
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as mime from 'mime-types';
import * as ComUtils from '../../../Common/Utils/ComUtils';
import { DOWNLOAD_LOCATION } from '../Server.Globals';
import FSUtils from '../../../Common/Utils/FSUtils';
import ServerResponsesProcessing, { IServerRequestInternalOptions } from './Server.Responses.Processing';
import { EHeaders } from '../../../Common/Interfaces';

export default class ServerResponseResources
{
	/////////////////////////////////////////////////////////////////////////////////////////
	/** Client -> Server */
	public static async ClientToServer(request: http.IncomingMessage, response: http.ServerResponse): Promise<Buffer | Error>
	{
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
		const result: Buffer | Error = await ServerResponsesProcessing.ProcessRequest(request, response, options);
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
		const options: IServerRequestInternalOptions = {};
		const filePath = path.join(DOWNLOAD_LOCATION, token, identifier);

		// Check if file exists
		if (!(await FSUtils.FileExistsAsync(filePath)))
		{
			const err = `Resource ${identifier} doesn't exist`;
			ServerResponsesProcessing.EndResponseWithError(response, err, 404);
			return ComUtils.ResolveWithError("ServerResponses:UploadResource", err);
		}

		options.Headers = {};
		{
			// Check if content type can be found
			const contentType: string = mime.lookup(path.parse(filePath).ext) || 'application/octet-stream';
			options.Headers['content-type'] = contentType;

			// Check file Size
			const sizeInBytes: number | null = FSUtils.GetFileSizeInBytesOf(filePath);
			if (sizeInBytes === null)
			{
				const err = `Cannot obtain size of file ${filePath}`;
				ServerResponsesProcessing.EndResponseWithError(response, err, 400);
				return ComUtils.ResolveWithError("ServerResponses:UploadResource", err);
			}
			options.Headers['content-length'] = sizeInBytes;
		}

		options.ReadStream = fs.createReadStream(filePath);
		return ServerResponsesProcessing.ProcessRequest(request, response, options);
	};
}