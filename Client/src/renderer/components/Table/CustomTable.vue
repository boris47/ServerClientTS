<template>
	<div>
		<table>
			<thead>
				<tr><th colspan="1" v-for="(child, index) in headers" :style="`width: ${child.width}px`" :key="index">{{child.text}}</th></tr>
			</thead>
			<tbody ref="body">
				<tr v-for="(item, index) in ComputedContent" :key="index">
					<td v-for="(tablerow, index) in item.content" :key="index">
						<slot :tablerow="tablerow"></slot>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>

<script lang="ts">

import { Component, Prop, Vue } from 'vue-property-decorator';
import { PropOptions } from 'vue';

export interface ITableHeader
{
	id: string;
	field: string | null;
	text: string;
	width: number;
}

export interface ITableRowContent
{
	id: string;
	content: (string | number | boolean | HTMLElement)[];
}

@Component
export default class CustomTable extends Vue
{
	/** Table headers */
	@Prop(<PropOptions<Array<string>>>
	{
		required: true,		type: Array,
		default: () => new Array,
		validator: (value: string[]) => true,
	})
	protected readonly headers: string[];

	/** Table rows */
	@Prop(<PropOptions<Array<ITableRowContent>>>
	{
		required: true,		type: Array,
		default: () => new Array,
		validator: (value: ITableRowContent[]) => true,
	})
	protected readonly content: ITableRowContent[];



	/////////////////////////////////////////////////////////////////////////////////////////
	get ComputedContent() : ITableRowContent[]
	{
		const computed = this.content.slice();
		const headersCount = this.headers.length;
		for( const { id, content } of computed )
		{
			let count : number;
			if( ( count = content.splice( headersCount ).length ) > 0 )
			{
				console.warn( `CustomTable:ComputedContent: Removed ${count} elements from content with id '${id}'` );
			}
		}
		return computed;
	}

}

</script>

<style scoped>

table, th, tr, td {
	border: 1px solid black;
	border-radius: 5px;
	border-collapse: collapse;
}

th {
	padding: 5px;
	text-align: left;    
}

</style>