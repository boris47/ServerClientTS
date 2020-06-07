<template>
	<button type="button" :disabled="bIsDisabled" @click.stop="onClick">
		<span>{{textContent}}</span>
		<progress-spinner :side=15 />
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
		validator: (value: boolean) => typeof value === 'boolean',
	})
	protected readonly bIsDisabled: boolean;

	/** Button text content */
	@Prop(<PropOptions<String>>
	{
		required: true,		type: String,
		default: () => '',
		validator: (value: string) => typeof value === 'string',
	})
	protected readonly textContent: string;


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
        outline: none;
        border-radius: 4px;
        display: inline-flex;
        align-items: center;
        position: relative;
        user-select: none;
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

</style>