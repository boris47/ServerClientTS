<template>
	<global-layout>
		<div slot="header">
			<p>Test Page!</p>
			<!--div>
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
			</div-->
			<div><label>"My File selector"</label>
				<input-selector type='file' itemListTag='li' @select="onInputFilePathsSelected" multiple />
				<custom-button @click="UploadFiles" >Upload File</custom-button>
				<progress-bar :value="uploadComFlowManager.Progress.NormalizedValue" />
				<p v-if="bUploadRequestLaunched && bUploadRequestSucceded===true">SUCCESS</p>
				<p v-if="bUploadRequestLaunched && bUploadRequestSucceded===false">FAIL</p>
				<p v-if="!bUploadRequestLaunched">WAITING</p>
			</div>
			<div><label>"My Folder selector"</label>
				<input-selector type='folder' @select="onDownloadFolderSelected"></input-selector>
				<custom-button v-if="true || downloadFileLocation" @click="DownloadFile">Download File</custom-button>
				<progress-bar :value="downloadComFlowManager.Progress.NormalizedValue" />
				<p v-if="bDownloadRequestLaunched && bDownloadRequestSucceded===true">SUCCESS</p>
				<p v-if="bDownloadRequestLaunched && bDownloadRequestSucceded===false">FAIL</p>
				<p v-if="!bDownloadRequestLaunched">WAITING</p>
			</div>
			<!--div><label>"My Progress Bar"</label>
					<progress-bar :value='75'/>
					<progress-bar/>
				<label>"My Progress Spinner"</label>
					<progress-spinner :value="66.5"/>
					<progress-spinner/>
			</div>
			<div><label>"My Table"</label>
				<custom-table :headers="headers" :tableRows="tableRows"></custom-table>
			</div>
			<div><label>"My Select"</label>
				<custom-select :values="selectVoices" @select="onSelected_Select"/>
			</div>
			<div><label>"My datalist"</label>
				<custom-datalist :values="['Roberto', 'Melissa', 'Davide', 'Mariateresa']" @select="onSelected_Datalist"/>
			</div-->
		</div>
	</global-layout>
</template>

<script lang="ts">

import { Component, Vue } from 'vue-property-decorator';
import { ICP_RendererComs } from '../icpRendererComs';
import { EComunications } from '../../icpComs';
import GenericUtils from '../../../../Common/Utils/GenericUtils';

import { ITableHeader, ITableRow } from '../components/Table/CustomTable.vue';
import CustomButton from '../components/CustomButton.vue';
import { ComFlowManager } from '../../../../Common/Utils/ComUtils';


@Component
export default class TestPage extends Vue
{

	protected selectVoices = ['New York', 'Los Angeles', 'Paris', 'Washington', 'Seattle', 'San Francisco', 'Los Angeles'];

	protected onSelected_Select = (selected: string, index: number) => console.log(index, selected);
	protected onSelected_Datalist = ( index: number, value: string ) => console.log(index, value);

	protected valueToSet = '';
	protected bSetRequestSucceded = false;
	protected bSetRequestLaunched = false;

	protected getValue = ''
	protected bGetRequestSucceded = false;
	protected bGetRequestLaunched = false;

	protected inputFilePaths = Array<string>();
	protected bUploadRequestSucceded = false;
	protected bUploadRequestLaunched = false;
	protected uploadComFlowManager  = new ComFlowManager;

	protected downloadFileLocation = '';
	protected listToDownload = Array<string>();
	protected bDownloadRequestSucceded = false;
	protected bDownloadRequestLaunched = false;
	protected downloadComFlowManager  = new ComFlowManager;

	protected headers = Array<ITableHeader>();
	protected tableRows = Array<ITableRow>();


	protected created()
	{
		console.log('Test Page');
		const header1 : ITableHeader = { id: '1', text: 'Header 1', width: 25 };
		const header2 : ITableHeader = { id: '2', text: 'Header 2', width: 10 };
		const header3 : ITableHeader = { id: '3', text: 'Header 3', width: 10 };
		this.headers.push(header1, header2, header3);

		const htmlButton = document.createElement('button');
		htmlButton.onclick = () => (this.tableRows[1].content[2].value as number)++;
		htmlButton.textContent = 'Dom Button!!';

		const customButtonEnabled = new CustomButton({ propsData: { textContent: 'Enabled Button' } });
		const customButtonDisabled = new CustomButton({ propsData: { textContent: 'Disable Button', isDisabled: true } });

		this.tableRows.push(
			{
				content: [ { id: '1', value: 'prova col 1x1' }, { id: '2', value: 'prova col 1x2' }, { id: '3', value: 'prova col 1x3' }, ]
			},
			{
				content: [ { id: '1', value: true }, { id: '2', value: null }, { id: '3', value: 5 }, ]
			},
			{
				content: [ { id: '1', value: customButtonEnabled }, { id: '2', value: htmlButton }, { id: '3', value: customButtonDisabled }, ]
			},
			{
				content: [ { id: '5', value: '' }, { id: '2', value: undefined }, { id: '3', value: 'Melissa Ti Amo' }, ]
			}
		);
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
			console.error( result, /*`"${result.name}:${result.message}"`*/ );
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

		const result = await ICP_RendererComs.Invoke<Buffer | Error>(EComunications.REQ_PUT, null, 'keyy', JSON.stringify(test));
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
		const result = await ICP_RendererComs.Invoke<Buffer | null | Error>( EComunications.REQ_GET, null, 'keyy' );
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
			const result = await ICP_RendererComs.Invoke<Buffer | Error>( EComunications.REQ_UPLOAD, this.uploadComFlowManager, filePath );
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
		const result = await ICP_RendererComs.Invoke<Buffer | Error>( EComunications.REQ_DOWNLOAD, this.downloadComFlowManager, 'electron.exe', this.downloadFileLocation );
		if( !(this.bUploadRequestSucceded = Buffer.isBuffer( result )))
		{
			console.error( `"${result.name}:${result.message}"` );
		}
		else
		{
			console.log(`TestPage:DownloadFile: Download completed, ${result.toString()}` );
		}
	}
}

</script>

<style scoped>

td {
	border: 1px solid black;
	border-radius: 5px;
	border-collapse: collapse;
}

</style>