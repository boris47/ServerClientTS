<template>
	<div>
		<table>
			<thead>
				<tr>
					<th v-for="(child, index) in headers" v-bind:key="index" v-bind:style="`width: ${child.width}`">{{child.text}}</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="(tableRow/*ITableRow*/, index) in ComputedContent" v-bind:key="index">
					<custom-table-td v-for="(tableRowContent/*ITableRowContent*/, index) in tableRow.content" v-bind:key="index" :value="tableRowContent.value"/>
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
	text: string;
	width: number;
}

export interface ITableRow
{
	content: ITableRowContent[];
}

export interface ITableRowContent
{
	id: string;
	value: (null | undefined | string | number | boolean | Vue | HTMLElement);
}

@Component
export default class CustomTable extends Vue
{
	/** Table headers */
	@Prop(<PropOptions<Array<ITableHeader>>>
	{
		required: false,		type: Array,
		default: () => new Array,
		validator: (value: ITableHeader[]) => true,
	})
	protected readonly headers: ITableHeader[];

	/** Table rows */
	@Prop(<PropOptions<Array<ITableRow>>>
	{
		required: true,		type: Array,
		default: () => new Array,
		validator: (value: ITableRow[]) => true,
	})
	protected readonly tableRows: ITableRow[];


	/////////////////////////////////////////////////////////////////////////////////////////
	get ComputedContent() : ITableRow[]
	{
		const headersIds = this.headers.map( h => h.id );
		return this.tableRows.map( ( tableRow: ITableRow ) =>
		{
			return {
				content : headersIds.map( ( headerId ) : ITableRowContent => tableRow.content.find( rc => rc.id === headerId ) || { id: headerId, value: undefined } )
			};
		});
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