
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { Readable, Writable } from 'stream';

export namespace AxiosWrapper
{
	/** @see https://github.com/axios/axios#request-config */
	export type DataTypeAccepted = string | object | ArrayBuffer | ArrayBufferView | URLSearchParams | Buffer | Readable | Writable;

	export function CreateInstance(baseURL: string, timeout: number = 1000, decompress: boolean = true ): AxiosInstance
	{
		const config: AxiosRequestConfig = { baseURL, timeout, decompress };
		return axios.create(config);
	}

	export function Request<T=any>(config: AxiosRequestConfig): Promise<T|(Error|AxiosError<T>)>
	{
		return axios.request(config).then<T>( res => res.data ).catch(err => err );
	}

	export function Get<T=any>(url: string, config?: AxiosRequestConfig): Promise<T|(Error|AxiosError<T>)>
	{
		return axios.get<T>(url, config).then<T>( res => res.data ).catch(err => err );
	}

	export function Head<T=any>(url: string, config?: AxiosRequestConfig): Promise<T|(Error|AxiosError<T>)>
	{
		return axios.head<T>(url, config).then<T>( res => res.data ).catch(err => err );
	}

	export function Post<T=any>(url: string, data?: DataTypeAccepted, config?: AxiosRequestConfig): Promise<T|(Error|AxiosError<T>)>
	{
		return axios.post<T>(url, data, config).then<T>( res => res.data ).catch(err => err );
	}

	export function Put<T=any>(url: string, data?: DataTypeAccepted, config?: AxiosRequestConfig): Promise<T|(Error|AxiosError<T>)>
	{
		return axios.put<T>(url, data, config).then<T>( res => res.data ).catch(err => err );
	}

	export function Delete<T=any>(url: string, config?: AxiosRequestConfig): Promise<T|(Error|AxiosError<T>)>
	{
		return axios.delete<T>(url, config).then<T>( res => res.data ).catch(err => err );
	}

	export function Patch<T=any>(url: string, data?: DataTypeAccepted, config?: AxiosRequestConfig): Promise<T|(Error|AxiosError<T>)>
	{
		return axios.patch<T>(url, data, config).then<T>( res => res.data ).catch(err => err );
	}
}