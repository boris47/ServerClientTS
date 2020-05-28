<template>
	<div>
		<div class="progress-bar-viewport">
			<div v-if="!value" class="progress-bar-novalue"></div>
			<div v-else class="progress-bar-value" :style="`width: ${normalizedValue}%;`"></div>
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
		validator: (value: number) => value === undefined || value >= 0 && value < 101,
	})
	protected value: number;

	/////////////////////////////////////////////////////////////////////////////////////////
	get normalizedValue()
	{
		return Math.min(Math.max(0, this.value), 100);
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

.progress-bar-value
{
	background-color: green;
	height: 100%;
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
