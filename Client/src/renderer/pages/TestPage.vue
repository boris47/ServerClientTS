<template>
	<global-layout>
		<div slot="header">
			<p>Test Page!</p>
			<div>
				<input type="text" v-model="valueToSet"/>
				<button type="button" @click.stop="SetValue">Set value</button>
				<p v-if="bSetRequestLaunched && bSetRequestSucceded===true">SUCCESS</p>
				<p v-if="bSetRequestLaunched && bSetRequestSucceded===false">FAIL</p>
				<p v-if="!bSetRequestLaunched">WAITING</p>
			</div>
			<div>
				<button type="button" @click.stop="GetValue">Get value</button>
				<p v-if="bGetRequestLaunched && bGetRequestSucceded===true">SUCCESS</p>
				<p v-if="bGetRequestLaunched && bGetRequestSucceded===false">FAIL</p>
				<p v-if="!bGetRequestLaunched">WAITING</p>
				<p v-if="bGetRequestLaunched && bGetRequestSucceded===true">{{getValue}}</p>
			</div>
			<div>
				<input-selector type='file' itemListTag='li' @on-selector="onInputFilePathsSelected" multiple></input-selector>
				<button type="button" @click.stop="UploadFiles">Upload File</button>
				<p v-if="bUploadRequestLaunched && bUploadRequestSucceded===true">SUCCESS</p>
				<p v-if="bUploadRequestLaunched && bUploadRequestSucceded===false">FAIL</p>
				<p v-if="!bUploadRequestLaunched">WAITING</p>
			</div>
			<div>
				<input-selector type='folder' @on-selector="onDownloadFolderSelected"></input-selector>
				<ul>

				</ul>
				<button v-if="downloadFileLocation" type="button" @click.stop="DownloadFile">Download File</button>
				<p v-if="bDownloadRequestLaunched && bDownloadRequestSucceded===true">SUCCESS</p>
				<p v-if="bDownloadRequestLaunched && bDownloadRequestSucceded===false">FAIL</p>
				<p v-if="!bDownloadRequestLaunched">WAITING</p>
			</div>
		</div>
	</global-layout>
</template>

<script lang="ts">

import { Component, Vue } from 'vue-property-decorator';
import { ICP_RendererComs } from '../icpRendererComs';
import { EComunications } from '../../icpComs';
import GenericUtils from '../../../../Common/Utils/GenericUtils';

@Component
export default class TestPage extends Vue
{
	protected valueToSet = '';
	protected bSetRequestSucceded = false;
	protected bSetRequestLaunched = false;

	protected getValue = ''
	protected bGetRequestSucceded = false;
	protected bGetRequestLaunched = false;

	protected inputFilePaths = Array<string>();
	protected bUploadRequestSucceded = false;
	protected bUploadRequestLaunched = false;

	protected downloadFileLocation = '';
	protected listToDownload = Array<string>();
	protected bDownloadRequestSucceded = false;
	protected bDownloadRequestLaunched = false;

	protected created()
	{
		console.log('Test Page');
	}

	protected onInputFilePathsSelected( selected: string[] )
	{
		this.inputFilePaths = selected;
	}

	protected async onDownloadFolderSelected( [folderPath] : string ) : Promise<void>
	{
		console.log("onDownloadFolderSelected", folderPath)
		this.downloadFileLocation = folderPath;
		const result = await ICP_RendererComs.Invoke<Buffer | Error>( EComunications.REQ_LIST );
		if ( Buffer.isBuffer(result) )
		{
			console.log("onDownloadFolderSelected", result.toString())
		}
		else
		{
			console.error( `"${result.name}:${result.message}"` );
		}
	}

	protected async SetValue()
	{
		this.bSetRequestLaunched = true;

		const test = Array<string>();
		for (let index = 0; index < 15; index++)
		{
			test.push( `Test Array ${index}` );
		}

		const result = await ICP_RendererComs.Invoke<Buffer | Error>(EComunications.REQ_PUT, 'keyy', JSON.stringify(test));
		if( !(this.bSetRequestSucceded = Buffer.isBuffer( result )))
		{
			console.error( `"${result.name}:${result.message}"` );
		}
		else
		{
			console.log( "Test Page: SetValue()", result.toString());
		}
	}

	protected async GetValue()
	{
		this.bGetRequestLaunched = true;
		const result = await ICP_RendererComs.Invoke<Buffer | null | Error>( EComunications.REQ_GET, 'keyy' );
		if( this.bGetRequestSucceded = Buffer.isBuffer( result ) )
		{
			this.getValue = result.toString();
		}
		else if ( GenericUtils.IsTypeOf(result, Error) )
		{
			console.error( `"${result.name}:${result.message}"` );
		}
		else
		{
			console.error( `GetValue received null value` );
		}
	}

	protected async UploadFiles()
	{
		this.bUploadRequestLaunched = true;
		for(const filePath of this.inputFilePaths)
		{
			const result = await ICP_RendererComs.Invoke<Buffer | Error>( EComunications.REQ_UPLOAD, filePath );
			if( !(this.bUploadRequestSucceded = Buffer.isBuffer( result )))
			{
				console.error( `"${result.name}:${result.message}"` );
				break;
			}
			else
			{
				console.log(`TestPage:UploadFiles: Upload completed for ${filePath}`);
			}
		}
	}

	protected async DownloadFile()
	{
		this.bDownloadRequestLaunched = true;
		const result = await ICP_RendererComs.Invoke<Buffer | Error>( EComunications.REQ_DOWNLOAD, 'Clear.bat', this.downloadFileLocation );
		if( !(this.bUploadRequestSucceded = Buffer.isBuffer( result )))
		{
			console.error( `"${result.name}:${result.message}"` );
		}
		else
		{
			console.log(`TestPage:UploadFiles: Download completed, ${result.toString()}` );
		}
	}
}

</script>