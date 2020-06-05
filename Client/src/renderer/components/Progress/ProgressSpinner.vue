<template>
	<div class="dual-ring" :style="style"/>
</template>

<script lang="ts">

import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { PropOptions } from 'vue';

@Component
export default class ProgressSpinner extends Vue
{
	/** Determine button to be disabled */
	@Prop(<PropOptions<Number>>
	{
		required: false,		type: Number,
		default: () => 64,
		validator: (value: number) => value > 0,
	})
	protected side: number;

	/** Determine button to be disabled */
	@Prop(<PropOptions<Number>>
	{
		required: false,		type: Number,
		default: () => 64,
		validator: (value: number) => value > 0,
	})
	protected height: number;

	protected style : string = '';


	@Watch('side')
	protected OnSideChanged( newValue: number )
	{
		console.log('watch')
		this.side = newValue;
		this.UpdateStyle();
	}

	protected mounted()
	{
		console.log('mounted')
		this.UpdateStyle();
	}

	private UpdateStyle()
	{
		const factor = ( this.side / 64 );
		const borderWidth = factor * 6;
		const marginTop = factor * 3;
		this.style = `
			width: ${this.side}px;
			height: ${this.side}px;
			margin: ${marginTop}px;
			border-width: ${borderWidth}px;
		`;
	}
}

</script>

<style scoped>

.dual-ring {
	content: "";
	display: block;
	width: 64px;
	height: 64px;
	margin-top: 3px;
	border-radius: 50%;
	border-width: 6px;
	border-style: solid;
	border-color: green transparent green transparent;
	animation: lds-dual-ring 1.2s linear infinite;
}
@keyframes lds-dual-ring {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}

</style>