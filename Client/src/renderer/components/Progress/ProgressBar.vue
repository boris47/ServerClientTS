<template>
	<div>
		<div class="progress-bar-viewport">
			<span v-if="value >= 0" class="progress-percentage">{{ClampedValue}}</span>
			<div v-if="value === undefined" class="progress-bar-novalue"/>
			<div v-else-if="value === -1" class="progress-bar-error"/>
			<div v-else class="progress-bar-value" :style="`width: ${ProgressBarWidth}%;`"/>
		</div>
	</div>
</template>

<script lang="ts">

import { Component, Prop, Vue } from 'vue-property-decorator';
import { PropOptions } from 'vue';

@Component
export default class ProgressBar extends Vue
{
	/** Progress value */
	@Prop(<PropOptions<Number>>
	{
		required: false,		type: Number,
		default: () => undefined,
		validator: (value: number) => value >= -1 && value < 101,
	})
	protected value: number;

	/** Show Percentage */
	@Prop(<PropOptions<Boolean>>
	{
		required: false,		type: Boolean,
		default: () => false,
		validator: (value: boolean) => typeof value === 'boolean',
	})
	protected bShowPercentage: boolean;

	/////////////////////////////////////////////////////////////////////////////////////////
	get ClampedValue(): number
	{
		return (Math.min(Math.max(0, this.value), 1) * 100) << 0;
	}

	get ProgressBarWidth(): number
	{
		return Math.min(Math.max(0, this.value), 100) * 100;
	}
}

</script>


<style scoped>

</style>
