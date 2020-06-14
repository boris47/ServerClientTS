<template>
	<div>
		<custom-button class="custom-buttom" @click="ToggleSelect">
				<span class="current-selected" ref="selected">{{currentSelected ? currentSelected : 'Select...'}}</span>
				<span class="right-align-text-18">&#8801;</span>
		</custom-button>
		<div class="items" ref="items" v-if="isOpen">
			<div v-for="(option, index) of ComputedValues" class="item" :key="index" @click.stop="OnSelect(option, index)">{{ option }}</div>
		</div>
	</div>
</template>

<script lang="ts">

import { Component, Prop, Vue } from 'vue-property-decorator';
import { PropOptions } from 'vue';

import ArrayUtils from '../../../../Common/Utils/ArrayUtils';

@Component
export default class CustomSelect extends Vue
{
	/** The array as content of select */
	@Prop(<PropOptions<Array<string>>>
	{
		required: true,		type: Array,
		default: () => ['EMPTY'],
		validator: (value: string[]) => ArrayUtils.IsArrayOfType( value, 'string' ) && value.length > 0
	})
	private readonly values: string[];

	private currentSelected: string = '';
	protected isOpen: boolean = false;

	/////////////////////////////////////////////////////////////////////////////////////////
	protected get ComputedValues()
	{
		return Array.from( new Set( ['', ...this.values] ) );
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	protected get IsEmpty()
	{
		return this.currentSelected === null || this.currentSelected === '';
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	protected  created()
	{
		document.addEventListener('click', this.clickOutsideEvent)
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	protected  destroyed()
	{
		document.removeEventListener('click', this.clickOutsideEvent)
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	private clickOutsideEvent( event: MouseEvent )
	{
		const path = ((( event as any ).path || (event.composedPath && event.composedPath())) as EventTarget[] )
		if ( !path.includes( this.$refs.items as Element ) )
		{
			this.isOpen = false;
		}
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	protected ToggleSelect()
	{
		this.isOpen = !this.isOpen;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	protected OnSelect( value: string, index: number )
	{
	//	console.log( "CustomSelect", value );
		this.isOpen = false;
		( this.$refs.selected as HTMLSpanElement ).textContent = this.currentSelected = value;
		this.$emit( 'select', value, index );
	}
}

</script>


<style scoped>
/*
	.items {
		position: relative;
		width: 200px;
		text-align: left;
		outline: none;
		height: 47px;
		line-height: 20px;

		
		border-radius: 0px 0px 6px 6px;
		overflow: hidden;
		
		border-right: 1px solid #50b628;
		border-left: 1px solid #50b628;
		border-bottom: 1px solid #50b628;
		
		left: 0;
		right: 0;
		z-index: 100;
	}

	.item {
		background-color: #bea191;
		color: #000000;
		padding-left: 8px;
		cursor: pointer;
		user-select: none;
	}
*/

	.current-selected {
		width: 100%;
		text-align: left;
	}

	.right-align-text-18 {
		font-size:18px;
		width: 100%;
		text-align: right;
	}

	.custom-buttom {
		width: 200px;
	}

	.items {
		position: absolute;
		overflow: auto;
		width: 194px;
		height: 70px;
		z-index: 100;
		color: #000000;
		border-radius: 6px;
		border-color: #CE9B2C;
		border-style: solid;
		background-color: #bea191;
	}

	.item {
		padding-left: 8px;
	}

	.item:hover {
		cursor: pointer;
		background-color: #50b628;
	}

</style>