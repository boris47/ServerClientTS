<template>
	<button
		type="button"
		:class="type"
		:width="width"
		:height="height"
		:disabled="isDisabled"
		@click.stop="onClick"
	></button>
</template>


<script lang="ts">

	export default {
		
		name: "Button",

		props:
		{
			disabled: Boolean,
			type: {
				type: String,
				default: 'default',
				validator( value : string )
				{
					return [ 'default', 'error' ].includes( value );
				}
			}
		},

		data: function()
		{
			return {
				isDisabled: this.disabled
			};
		},

		computed:
		{
			justification: () => 'center'
		},

		watch:
		{
			disabled()
			{
				this.isDisabled = this.disabled;
			}
		},

		methods:
		{
			onClick( event: any )
			{
				this.$emit( 'click', event );
			}
		}
	};
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
	transition: background-color 0.2s, color 0.2s;
}
</style>