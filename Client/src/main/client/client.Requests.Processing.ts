
import * as http from 'http';
import * as stream from 'stream';
import axios, { AxiosRequestConfig, AxiosError, Method } from 'axios';

import * as ComUtils from '../../../../Common/Utils/ComUtils';
import { ComFlowManager } from '../../../../Common/Utils/ComUtils';
import GenericUtils from '../../../../Common/Utils/GenericUtils';



export interface IClientRequestInternalOptions
{
	DownloadLocation?: string;
	Value?: string | Buffer;
	Headers?: http.IncomingHttpHeaders;
	ReadStream?: stream.Readable;
	WriteStream?: stream.Writable;
	ComFlowManager?: ComFlowManager | undefined;
}


export class ClientRequestsProcessing
{
	/**  */
	private static ResetClientInternalOptionsToBad(clientRequestInternalOptions: IClientRequestInternalOptions): void
	{
		clientRequestInternalOptions.WriteStream?.removeAllListeners();
		clientRequestInternalOptions.WriteStream?.destroy();
		clientRequestInternalOptions.ReadStream?.removeAllListeners();
		clientRequestInternalOptions.ReadStream?.unpipe();
		clientRequestInternalOptions.ReadStream?.destroy();
		clientRequestInternalOptions.ComFlowManager?.Progress.SetProgress(-1, 1);
		clientRequestInternalOptions.Value = undefined;
	}


	/** Server -> Client */
	public static async HandleDownload(options: http.RequestOptions, clientRequestInternalOptions: IClientRequestInternalOptions ): Promise<Buffer | Error>
	{
		const config: AxiosRequestConfig = 
		{
			baseURL: `http://${options.host}:${options.port}`,
			timeout: options.timeout,
			decompress: true,

			url: options.path,
			method: options.method as Method,
			headers: clientRequestInternalOptions.Headers,
			responseType: clientRequestInternalOptions.WriteStream ? 'stream' : 'arraybuffer',
		};

		const response = await axios.request<stream.Readable | Buffer>(config).then(response => response ).catch(err => err);
		if (response instanceof axios.Cancel)
		{
			let err = new Error(response.message);
			err.name = `ClientRequestsProcessing:HandleDownload`;
			return err;
		}
		if (GenericUtils.IsTypeOf(response, Error))
		{
			return response;
		}

		
		const responseBody: Buffer | stream.Readable = response.data;
		if (Buffer.isBuffer(responseBody))
		{
			clientRequestInternalOptions.ComFlowManager?.Progress.SetProgress(1, 1);
			return Buffer.from(responseBody);
		}
			
		const contentLength: number = parseInt(response.headers['content-length'], 10);
		let loadedBytes = 0;
		responseBody.pipe(clientRequestInternalOptions.WriteStream);
		responseBody.on( 'data', (chunk: Buffer) =>
		{
			loadedBytes += chunk.length;
			clientRequestInternalOptions.ComFlowManager?.Progress.SetProgress(contentLength, loadedBytes);
		});

		return new Promise( resolve =>
		{
			clientRequestInternalOptions.WriteStream.on('close', () => resolve(Buffer.from('OK')) );
			clientRequestInternalOptions.WriteStream.on('error', resolve );
		});
	}

//	private static isReadableStream(body: any): body is stream.Readable
//	{
//		return typeof body.pipe === "function";
//	}


	/** Client -> Server */
	public static HandleUpload(options: http.RequestOptions, clientRequestInternalOptions: IClientRequestInternalOptions): Promise<Buffer | Error>
	{
		const contentLength: number = parseInt(clientRequestInternalOptions.Headers['content-length'], 10);
		let loadedBytes = 0;
		const uploadReportStream = new stream.Transform(
			{
				transform: (chunk: string | Buffer, _encoding: string, callback: stream.TransformCallback) =>
				{
					loadedBytes += chunk.length;
					clientRequestInternalOptions.ComFlowManager?.Progress.SetProgress(contentLength, loadedBytes);
					callback(undefined, chunk);
				}				
			}
		);

		if (clientRequestInternalOptions.ReadStream)
		{
			clientRequestInternalOptions.ReadStream = clientRequestInternalOptions.ReadStream.pipe(uploadReportStream);
		}
		else
		{
			uploadReportStream.end(clientRequestInternalOptions.Value);
		}
		const config: AxiosRequestConfig = 
		{
			baseURL: `http://${options.host}:${options.port}`,
			timeout: options.timeout,
			decompress: true,

			maxBodyLength: contentLength,
			data: clientRequestInternalOptions.ReadStream || clientRequestInternalOptions.Value,
			url: options.path,
			method: options.method as Method,
			headers: clientRequestInternalOptions.Headers,
			responseType: 'arraybuffer',
		};

		return axios.request<Buffer>(config).then( res => res.data ).catch((err: Error|AxiosError<Buffer>) =>
		{
			ClientRequestsProcessing.ResetClientInternalOptionsToBad(clientRequestInternalOptions);
			return err;
		});
	}


	/** Server -> Client (No Write Stream) */
	public static async SimpleRequest(options: http.RequestOptions, clientRequestInternalOptions: IClientRequestInternalOptions): Promise<Buffer | Error>
	{
		clientRequestInternalOptions.WriteStream?.destroy(); // Ensura data will be sent into body
		clientRequestInternalOptions.WriteStream = undefined;
		return ClientRequestsProcessing.HandleDownload(options, clientRequestInternalOptions);
	}


	/** Private */
	private static MakeRequest(options: http.RequestOptions, clientRequestInternalOptions: IClientRequestInternalOptions, resolve: (value: Error | Buffer) => void): http.ClientRequest
	{
		ClientRequestsProcessing.MakeRequest
		options.headers = clientRequestInternalOptions.Headers;
		
		let request: http.ClientRequest = undefined;
//		const bUseFollowRedirect = true;
//		if (bUseFollowRedirect)
//		{
//			const followOptions: followRedirects.FollowOptions<http.RequestOptions> =
//			{
//				followRedirects: true,
//				maxRedirects: 21, // default
//				maxBodyLength: 2 * 1024 * 1024 * 1024, // 2GB
			//	beforeRedirect: ( options: http.RequestOptions & followRedirects.FollowOptions<http.RequestOptions>, responseDetails: followRedirects.ResponseDetails ) =>
			//	{
			//		if (false)
			//		{
			//			throw Error("no errors");
			//		}
			//	}
//			};			
//			const requestOptions: (http.RequestOptions & followRedirects.FollowOptions<http.RequestOptions>) = { ...options, ...followOptions };
//			request = followRedirects.http.request(requestOptions) as http.ClientRequest;
//		}
//		else
//		{
			request = http.request(options);
//		}

		request.on('timeout', () =>
		{
			request.destroy();
			ComUtils.ResolveWithError('ClientRequestsProcessing:MakeRequest:[TIMEOUT]', `Request for path ${options.path}`, resolve);
			ClientRequestsProcessing.ResetClientInternalOptionsToBad(clientRequestInternalOptions);
		});

		request.on('error', (err: Error) =>
		{
			ComUtils.ResolveWithError('ClientRequestsProcessing:MakeRequest:[ERROR]', err, resolve);
			ClientRequestsProcessing.ResetClientInternalOptionsToBad(clientRequestInternalOptions);
		});

		request.on( 'abort', () =>
		{
			ComUtils.ResolveWithError('ClientRequestsProcessing:MakeRequest:[ABORT]', `Request for path ${options.path}`, resolve);
			ClientRequestsProcessing.ResetClientInternalOptionsToBad(clientRequestInternalOptions);
		});

		return request;
	}
}