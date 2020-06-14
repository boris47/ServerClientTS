<template>
	<button type="button" :disabled="isDisabled || isLoading" :loading="isLoading" @click.stop="onClick">
		<span>{{textContent}}</span>
		<slot></slot>
		<progress-spinner v-if="isLoading" :value="value" :side=15 />
	</button>
</template>

<script lang="ts">

import { Component, Prop, Vue } from 'vue-property-decorator';
import { PropOptions } from 'vue';


@Component
export default class CustomButton extends Vue
{
	/** Determine button to be disabled */
	@Prop(<PropOptions<Boolean>>
	{
		required: false,		type: Boolean,
		default: () => false,
		validator: (value: boolean) => true,
	})
	protected readonly isDisabled: boolean;

	/** Button text content */
	@Prop(<PropOptions<String>>
	{
		required: false,		type: String,
		default: () => '',
		validator: (value: string) => true,
	})
	protected readonly textContent: string;

	/** Button Loadind Spinner Toggle */
	@Prop(<PropOptions<Boolean>>
	{
		required: false,		type: Boolean,
		default: () => false,
		validator: (value: boolean) => true,
	})
	protected readonly isLoading: boolean;

	/** Button Loadind Spinner Value */
	@Prop(<PropOptions<Number>>
	{
		required: false,		type: Number,
		default: () => 0,
		validator: (value: number) => value > -1 && value < 101,
	})
	protected readonly value: number;


	/////////////////////////////////////////////////////////////////////////////////////////
	protected onClick( event: InputEvent )
	{
		this.$emit( 'click', event );
	}
}

</script>

<style scoped>

	button {
		box-sizing: border-box;
		border-radius: 4px;
		display: inline-flex;
		align-items: center;
		position: relative;
		transition: background-color 0.2s, color .2s;
	}

	button:not([disabled]) {
		cursor: pointer;
	}

	button[disabled] {
		/* border: none; */
		background-color: #AAB1B5;
		color: #646C73;
	}

	button[loading] {
		background-color: #9cc6df;
	}

	progress-spinner[value] {
		margin-top: -25px;
	}

</style>