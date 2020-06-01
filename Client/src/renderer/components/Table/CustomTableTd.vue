
<template>
	<td ref="customTableData"/>
</template>

<script lang="ts">

import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { PropOptions } from 'vue';

@Component
export default class CustomTableTd extends Vue
{
	/** Table Cell Value */
	@Prop(<PropOptions<null | undefined | string | number | boolean | Vue | HTMLElement>>
	{
		required: true,
		default: () => undefined,
		validator: (value: null | undefined | string | number | boolean | Vue | HTMLElement ) => true,
	})
	protected value: null | undefined | string | number | boolean | Vue | HTMLElement;

	
	/////////////////////////////////////////////////////////////////////////////////////////
	private static AppendText( elm: Element, text :string | number | boolean )
	{
		const span : HTMLSpanElement = document.createElement('span');
		span.textContent = text.toString();
		elm.appendChild(span);
	}


	/////////////////////////////////////////////////////////////////////////////////////////
	private UpdateTd()
	{
		const elm = this.$refs.customTableData as Element;
		while (elm.firstChild) elm.removeChild(elm.lastChild);

		// STRING || NUMBER || BOOLEAN ( Primitive Types )
		if ( typeof this.value === 'string' || typeof this.value === 'number' || typeof this.value === 'boolean' )
		{
			CustomTableTd.AppendText( elm, this.value );
		}

		// UNDEFINED || NULL
		else if ( typeof this.value === 'undefined' || ( typeof this.value === 'object' && this.value === null ) )
		{
			CustomTableTd.AppendText( elm, typeof this.value === 'undefined' ? 'undefined' : 'NULL' );
		}

		// HTML ELEMENT
		else if ( this.value instanceof HTMLElement )
		{
			elm.appendChild( this.value );
		}

		// VUE COMPONENT
		else
		{
			elm.appendChild( document.createElement('slot').appendChild( this.value.$mount().$el ) );
		}
	}
	

	/////////////////////////////////////////////////////////////////////////////////////////
	protected mounted() 
	{
		this.UpdateTd();
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	@Watch('value')
	protected OnValueChanged( newValue: null | undefined | string | number | boolean | Vue | HTMLElement )
	{
		this.value = newValue;
		this.UpdateTd();
	}
}

</script>