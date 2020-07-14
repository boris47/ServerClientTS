<template>
	<global-layout>
		<div slot="header">
			<p>Test Page!</p>
			<div>
				<input type="text" v-model="valueToSet"/>
				<button type="button" @click.stop="SetValue">Set value</button>
				<progress-bar :value="setValueComFlowManager.Progress.NormalizedValue" />
			</div>
			<div>
				<input type="text" v-model="valueToGet"/>
				<button type="button" @click.stop="GetValue">Get value</button>
				<progress-bar :value="getValueComFlowManager.Progress.NormalizedValue" />
				<p v-if="valueGot">{{valueGot}}</p>
			</div>
			<div><label>"My File selector"</label>
				<input-selector type='file' itemListTag='li' @select="onInputFilePathsSelected" multiple />
				<custom-button @click="UploadFiles" >Upload File</custom-button>
				<progress-bar :value="uploadComFlowManager.Progress.NormalizedValue" />
			</div>
			<div><label>"My Folder selector"</label>
				<input-selector type='folder' @select="onDownloadFolderSelected"></input-selector>
				<custom-button v-if="downloadFileLocation" @click="DownloadFile">Download File</custom-button>
				<progress-bar :value="downloadComFlowManager.Progress.NormalizedValue" />
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
import { EComunicationsChannels } from '../../icpComs';
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
	protected setValueComFlowManager  = new ComFlowManager;

	protected valueToGet = '';
	protected valueGot = ''
	protected getValueComFlowManager  = new ComFlowManager;

	protected inputFilePaths = new Array<string>();
	protected uploadComFlowManager  = new ComFlowManager;

	protected downloadFileLocation = '';
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
		// @ts-ignore
		ICP_RendererComs.Invoke<NodeJS.ErrnoException | Buffer>(EComunicationsChannels.READ_FILE, null, '$resources/TestStatic.txt' )
		.then( (arg : NodeJS.ErrnoException | Buffer) =>
		{
			if ( Buffer.isBuffer(arg) )
			{
				console.log('Static: Content,', arg.toString());
			}
			else
			{
				console.error('Static: Error,', arg);
			}
		});
	}

	protected onInputFilePathsSelected( selected: string[] )
	{
		this.inputFilePaths = selected;
	}

	protected async onDownloadFolderSelected( [folderPath] : string ) : Promise<void>
	{
		console.log("onDownloadFolderSelected", folderPath)
		this.downloadFileLocation = folderPath;
		const result = await ICP_RendererComs.Invoke( EComunicationsChannels.REQ_LIST );
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
		const test = Array<string>();
		for (let index = 0; index < 15; index++)
		{
			test.push( `Test Array ${index}` );
		}

		const result = await ICP_RendererComs.Invoke(EComunicationsChannels.REQ_PUT, null, this.valueToSet, JSON.stringify(test));
		if( !Buffer.isBuffer( result ))
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
		const result = await ICP_RendererComs.Invoke( EComunicationsChannels.REQ_GET, null, this.valueToGet );
		if( Buffer.isBuffer( result ) )
		{
			this.valueGot = result.toString();
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
		for (const filePath of this.inputFilePaths)
		{
			const result = await ICP_RendererComs.Invoke( EComunicationsChannels.REQ_UPLOAD, this.uploadComFlowManager, filePath );
			if( !Buffer.isBuffer( result ))
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
		const result = await ICP_RendererComs.Invoke( EComunicationsChannels.REQ_DOWNLOAD, this.downloadComFlowManager, 'electron.exe', this.downloadFileLocation );
		if( !Buffer.isBuffer( result ))
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