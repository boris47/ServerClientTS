<template>
	<div>
		<input type="text" v-model="word" placeholder="Search"/>
		<ul v-if="filteredResults.length &gt; 0">
			<template v-for="(value, index) in filteredResults" >
			<li v-if="value" v-bind:key="index" @click="OnChoose(index, value)">
				<span>{{ value }}</span>
			</li>
			</template>
		</ul>
		<!--Add search icon-->
	</div>
</template>

<script lang="ts">

import { Component, Prop, Vue } from 'vue-property-decorator';
import { PropOptions } from 'vue';

import ArrayUtils from '../../../../Common/Utils/ArrayUtils';


@Component
export default class CustomDatalist extends Vue
{
	/** The object that will be used as map */
	@Prop(<PropOptions<Array<string>>>
	{
		required: true,	 	type: Array,
		default: () => [],
		validator: (value: Array<string>) => ArrayUtils.IsArrayOfType(value, 'string')
	})
	protected readonly values: Array<string>;

	protected word : string = '';


	/////////////////////////////////////////////////////////////////////////////////////////
	protected get filteredResults() : Array<string>
	{
		return this.values.map( ( value: string ) =>
		{
			return this.word && value.toLowerCase().indexOf(this.word) > -1 ? value : null;
		});
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	protected OnChoose( index: number, value: string )
	{
	//	console.log( "CustomDatalist", index, value );
		this.$emit( 'select', index, value );
	}
}

</script>


<style scoped>

	/* WIDTH */
	input, ul {
		width: 240px;
	}

	input {
		box-sizing: border-box;
        outline: none;
        border-radius: 4px;
        display: inline-flex;
        align-items: center;
        position: relative;
	}

	ul {
		font-family: 'Times New Roman';
		font-size: 13px;
		list-style: none;
		margin: 0;
		padding: 5px 0;
		background-color: white;
	}

	li {
		/* Top, Right, Bottom, Left */
		padding: 3px 0px 3px 15px;
		width: 225px;
		border-radius: 4px;
		display: block;
		cursor: pointer;
		white-space: nowrap;
		transition: background-color 0.2s, color .2s;
		background-color: rgba(197, 197, 197, 0.973);
	}

	li:hover {
		background-color: rgb(121, 121, 121);
	}

</style>