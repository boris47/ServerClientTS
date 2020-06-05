<template>
	<select v-model="currentSelected" @change="OnSelect($event)">
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
	/** Determine button to be disabled */
	@Prop(<PropOptions<Array<string>>>
	{
		required: false,		type: Array,
		default: () => [],
		validator: (value: string[]) => ArrayUtils.IsArrayOfType( value, 'string' )
	})
	protected readonly values: string[];

	protected currentSelected : string = null;

	protected OnSelect( event: Event )
	{
		console.log( "select clicked", this.currentSelected );
		this.$emit( 'select', this.currentSelected );
	}
}

</script>
