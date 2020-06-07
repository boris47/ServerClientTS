<template>
	<select v-model="currentSelected" :isempty="/*IsEmpty*/false" @change="OnSelect($event)">
		<option v-for="val of values" v-bind:key="val" :value="val">{{val}}</option>
	</select>
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
	protected readonly values: string[];

	protected currentSelected : string = null;

	/////////////////////////////////////////////////////////////////////////////////////////
	protected get IsEmpty()
	{
		return this.currentSelected === null || this.currentSelected === '';
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	protected OnSelect( event: Event )
	{
	//	console.log( "CustomSelect", this.currentSelected );
		this.$emit( 'select', this.currentSelected );
	}
}

</script>


<style scoped>

	select {
        box-sizing: border-box;
        outline: none;
        border-radius: 4px;
        display: inline-flex;
        align-items: center;
        position: relative;
    }

	select[isempty] {
		/* border: none; */
		background-color: #AAB1B5;
		color: #646C73;
	}

</style>