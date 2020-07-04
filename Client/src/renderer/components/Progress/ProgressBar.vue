<template>
	<div>
		<div class="progress-bar-viewport">
			<span v-if="ClampedValue >= 0" class="progress-percentage">{{ClampedValue}}</span>
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

.progress-bar-viewport
{
	width:400px; height:10px;
	border-radius: 5px;
	box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25) inset;
	background-color: white;
	overflow: hidden;
	display: inline-flex;
}

.progress-percentage
{
	width: 0px; height: 0px;
	position: relative;
	left: 50%;
	font-size: 10px;
	font-family: Arial, Helvetica, sans-serif;	
}

.progress-bar-value
{
	background-color: green;
	height: 100%;
}

.progress-bar-error
{
	background-color: red;
	width: 100%; height: 100%;
}

.progress-bar-novalue {
	background-color: green;
	width: 20%; height: 100%;

	animation-name: slide;
	animation-delay: 0s;
	animation-direction: normal;
	animation-duration: 2s;
	animation-iteration-count: infinite;
	animation-play-state: unset;
	animation-timing-function: linear;
}

@keyframes slide {
  from { transform: translateX(-100px); }
  to   { transform: translateX(500px); }
}

</style>
