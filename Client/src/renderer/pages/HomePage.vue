<template>
	<global-layout>
		<div slot="header">
			<p>Home Page!</p>
			<!--button type="button" @click.stop="GoToLoginPage">Login</button-->
			<div>
				<input type="text" v-model="setValue"/>
				<button type="button" @click.stop="SetValue">Set value</button>
				<h1 v-if="bSetRequestLaunched && bSetRequestSucceded===true">SUCCESS</h1>
				<h1 v-if="bSetRequestLaunched && bSetRequestSucceded===false">FAIL</h1>
				<h1 v-if="!bSetRequestLaunched">WAITING</h1>
			</div>
			<div>
				<button type="button" @click.stop="GetValue">Get value</button>
				<h1 v-if="bGetRequestLaunched && bGetRequestSucceded===true">SUCCESS</h1>
				<h1 v-if="bGetRequestLaunched && bGetRequestSucceded===false">FAIL</h1>
				<h1 v-if="!bGetRequestLaunched">WAITING</h1>
				<h1 v-if="bGetRequestLaunched && bGetRequestSucceded===true">{{getValue}}</h1>
			</div>
			<div>
				<input type="file" @change="SetInputFile($event)" :webkitdirectory="false">
				<button type="button" @click.stop="UploadFile">Upload File</button>
				<h1 v-if="bUploadRequestLaunched && bUploadRequestSucceded===true">SUCCESS</h1>
				<h1 v-if="bUploadRequestLaunched && bUploadRequestSucceded===false">FAIL</h1>
				<h1 v-if="!bUploadRequestLaunched">WAITING</h1>
			</div>

			<!--div>
				<input id="fileselector" type="file" @change="SetDownloadLocation($event)" webkitdirectory directory multiple="false" style="display:none" />
				<button onclick="getElementById('fileselector').click()">Browse</button>
				
				<input type="file"  @change="SetDownloadLocation($event)" webkitdirectory multiple>
				
				
				<button type="button" @click.stop="DownloadFile">Download File</button>
				<h1 v-if="bDownloadRequestLaunched && bDownloadRequestSucceded===true">SUCCESS</h1>
				<h1 v-if="bDownloadRequestLaunched && bDownloadRequestSucceded===false">FAIL</h1>
				<h1 v-if="!bDownloadRequestLaunched">WAITING</h1>
			</div-->
		</div>
	</global-layout>
</template>

<script lang="ts">

	import Vue from 'vue';
	import AppRouter from '../appRouter';
	import { ICP_RendererComs } from '../icpRendererComs';
	import { EComunications, EMessageContent } from '../../icpComs';
	import DomUtils from '../domUtils';


	interface IData
	{
		setValue: string;
		bSetRequestSucceded: boolean;
		bSetRequestLaunched: boolean;

		getValue: string;
		bGetRequestSucceded: boolean;
		bGetRequestLaunched: boolean;

		inputFilePath: string;
		bUploadRequestSucceded: boolean;
		bUploadRequestLaunched: boolean;

	//	donwloadFileLocation: string;
	//	bDownloadRequestSucceded: boolean;
	//	bDownloadRequestLaunched: boolean;
	}

	const data: IData =
	{
		setValue: '',
		bSetRequestSucceded: null,
		bSetRequestLaunched: false,

		getValue: '',
		bGetRequestSucceded: null,
		bGetRequestLaunched: false,

		inputFilePath: '',
		bUploadRequestSucceded: null,
		bUploadRequestLaunched: false,

	//	donwloadFileLocation: '',
	//	bDownloadRequestSucceded: null,
	//	bDownloadRequestLaunched: false,
	};

	export default Vue.extend({

		name: "HomePage",

		
		// A unique page we don't need of give data for each instance
		// https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function
		data: () => data,

		created()
		{
			console.log('HomePage');
		},

		methods: {

			GoToLoginPage()
			{
				AppRouter.NavigateTo('loginPage');
			},

			SetInputFile(event: Event)
			{
				const files = DomUtils.ProcessInputFiles(event);
				this.inputFilePath = files[0]?.path;
			},

	//		SetDownloadLocation(event: Event)
	//		{
	//			event.preventDefault();
	//			if( event.stopPropagation ) event.stopPropagation()
	//			console.log("event", Object.prototype.toString.call(event))
	//			console.log( DomUtils.ProcessInputFolder(event) );
	//		},

			async SetValue()
			{
				this.bSetRequestLaunched = true;
				const result = await ICP_RendererComs.Invoke<Buffer | Error>(EComunications.REQ_PUT, 'keyy', this.setValue);
				this.bSetRequestSucceded = Buffer.isBuffer( result );
			},

			async GetValue()
			{
				this.bGetRequestLaunched = true;
				const result = await ICP_RendererComs.Invoke<Buffer | Error>( EComunications.REQ_GET, 'keyy', EMessageContent.BUFFER );
				this.bGetRequestSucceded = Buffer.isBuffer( result );
				if( this.bGetRequestSucceded )
				{
					this.getValue = result.toString();
				}
			},

			async UploadFile()
			{
				this.bUploadRequestLaunched = true;
				const result = await ICP_RendererComs.Invoke<Buffer | Error>( EComunications.REQ_UPLOAD, this.inputFilePath );
				this.bUploadRequestSucceded = Buffer.isBuffer( result );
			},

	//		async DownloadFile()
	//		{
	//			this.bDownloadRequestLaunched = true;
	//			const result = await ICP_RendererComs.Invoke<Buffer | Error>( EComunications.REQ_DOWNLOAD, 'Server.js', this.donwloadFileLocation );
	//			this.bDownloadRequestSucceded = Buffer.isBuffer( result );
	//		}
		}
	});

</script>