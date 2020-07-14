<template>
	<div>
		<button type="button" @click.stop="SelectFile">{{ButtonLabel}}</button>
		<ul>
			<component
				class="inputSelectorListItem"
				v-bind:is="ValidatedTag"
				v-for="(item, index) in SelectedAbsolutePaths"
				v-bind:key="index"
			>{{item}}</component>
		</ul>
	</div>
</template>


<script lang="ts">

	import { Component, Prop, Vue } from 'vue-property-decorator';
	import { PropOptions } from 'vue';
	import electron from 'electron';
	import { ICP_RendererComs } from '../icpRendererComs';
	import { EComunicationsChannels } from '../../icpComs';
	import ObjectUtils from '../../../../Common/Utils/ObjectUtils';
import GenericUtils from '../../../../Common/Utils/GenericUtils';

	enum ESelectorType
	{
		FILE = 'file',
		FOLDER = 'folder',
	}

	enum EItemListTag
	{
		LIST_ITEM = 'li',
		PARAGRAPH = 'p',
		H1 = 'h1', H2 = 'h2', H3 = 'h3'
	}

	@Component
	export default class InputSelector extends Vue
	{
		private static readonly SupportedSelectorType = ObjectUtils.EnumToArray(ESelectorType);
		private static readonly SupportedItemListTag = ObjectUtils.EnumToArray(EItemListTag);

		/** Selector Type */
		@Prop(<PropOptions<ESelectorType>>
		{
			required: true,		type: String,
			default: () => ESelectorType.FILE,
			validator: (value: ESelectorType) => InputSelector.SupportedSelectorType.includes(value),
		})
		private readonly type: ESelectorType;

		/** Determine if multiple selection is enabled */
		@Prop(<PropOptions<boolean>>
		{
			required: false,	type: Boolean,
			default: () => false,
		})
		private readonly multiple: false;

		/** The component to use for list item rendering */
		@Prop(<PropOptions<EItemListTag>>
		{
			required: false,	type: String,
			default: () => EItemListTag.LIST_ITEM,
			validator: (v: EItemListTag) => InputSelector.SupportedItemListTag.includes(v),
		})
		protected readonly itemListTag: EItemListTag;

		/**  */
		protected SelectedAbsolutePaths: string[] = new Array<string>();


		/////////////////////////////////////////////////////////////////////////////////////////
		protected get ValidatedTag()
		{
			return InputSelector.SupportedItemListTag.includes(this.itemListTag) ? this.itemListTag : 'li';
		}


		/////////////////////////////////////////////////////////////////////////////////////////
		protected get ButtonLabel(): string
		{
			return this.type === ESelectorType.FOLDER ? "Select Folder" : "Select File";
		}


		/////////////////////////////////////////////////////////////////////////////////////////
		public async SelectFile(): Promise<void>
		{
			const property = this.type === ESelectorType.FILE ? 'openFile' : 'openDirectory';
			const multiple = this.multiple ? 'multiSelections' : undefined;
			const defaultPath = await ICP_RendererComs.Invoke(EComunicationsChannels.ELECTRON_PATH, null, 'exe');
			if ( !GenericUtils.IsTypeOf<string>( defaultPath, 'string' ) )
			{
				console.error( `InputSelector.SelectFile: Cannot retrieve defaultPath\nError${defaultPath}` );
				return;
			}
			
			const modalOptions : electron.OpenDialogSyncOptions =
			{
				defaultPath: defaultPath,
				properties: [property, multiple],
			};
			const result = await ICP_RendererComs.Invoke( EComunicationsChannels.ELECTRON_MODAL_OPEN, null, undefined, modalOptions );
			if ( !result.canceled && result.filePaths.length)
			{
				this.$emit("select", this.SelectedAbsolutePaths = result.filePaths);
			}
		}
	}

</script>

<style>
	.inputSelectorListItem {
		color: red;
	}
</style>
