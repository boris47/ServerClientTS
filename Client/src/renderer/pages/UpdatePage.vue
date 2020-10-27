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

	@Component
	export default class UpdatePage extends Vue
	{
		protected percent: number | undefined = 0;
		protected bytesPerSecond: string = '';

		protected created()
		{
			console.log('UpdatePage');

			this.percent = undefined;
			ICP_RendererComs.Listen( 'update-download-progress', ( percent: number, bytesPerSecond: number ) =>
			{
				this.percent = percent * 0.01;
				this.bytesPerSecond = StringUtils.FormatSpeedFromBytes(bytesPerSecond)
			});
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