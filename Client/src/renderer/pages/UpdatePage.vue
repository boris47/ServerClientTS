<template>
	<global-layout>
		<div slot="main">
			<p v-if="percent===undefined" class="centered">SEARCHING UPDATES!</p>
			<div v-else>
				<p class="centered">DOWNLOADING UPDATES!</p>
				<p class="centered">Speed: {{bytesPerSecond}}</p>
			</div>
			<div>
				<progress-bar :value="percent" />
			</div>
		</div>
	</global-layout>
</template>

<script lang="ts">

	import { Component, Vue } from 'vue-property-decorator';
	import { ICP_RendererComs } from '../icpRendererComs';

	import StringUtils from '../../../../Common/Utils/StringUtils';
	import AppRouter from '../appRouter';

	@Component
	export default class UpdatePage extends Vue
	{
		protected percent: number | undefined = 0;
		protected bytesPerSecond: string = '';

		protected created(): void
		{
			console.log('UpdatePage');

			this.percent = undefined;

			ICP_RendererComs.Listen( 'update-download-progress', this.UpdateDownloadProgress);
			ICP_RendererComs.Listen( 'on-update-news', this.OnUpdateNews );
		}

		protected destroy(): void
		{
			ICP_RendererComs.StopListening( 'update-download-progress', this.UpdateDownloadProgress);
			ICP_RendererComs.StopListening( 'on-update-news', this.OnUpdateNews );
		}

		private OnUpdateNews( bIsUpdateAvailable: boolean ): void
		{
			if (!bIsUpdateAvailable)
			{
				AppRouter.NavigateTo('loginPage');
			}
		}

		private UpdateDownloadProgress( percent: number, bytesPerSecond: number ): void
		{
			this.percent = percent * 0.01;
			this.bytesPerSecond = StringUtils.FormatSpeedFromBytes(bytesPerSecond)
		}
	}

</script>

<style scoped>
.centered {
	margin: auto;
	width: 50%;
	vertical-align: middle;
}
</style>