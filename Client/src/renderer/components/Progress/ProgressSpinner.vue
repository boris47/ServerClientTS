<template>
	<div>
		<div v-if="!value" class="dual-ring" :style="style"/>
		<progress v-else id="progress" :style="style" :value="computedValue" max="100"/>
	</div>
</template>

<script lang="ts">

import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { PropOptions } from 'vue';

@Component
export default class ProgressSpinner extends Vue
{
	/** The Spinner size in pixels */
	@Prop(<PropOptions<Number>>
	{
		required: false,		type: Number,
		default: () => 64,
		validator: (value: number) => value > 0,
	})
	protected side: number;

	/** Progress Spinner value */
	@Prop(<PropOptions<Number>>
	{
		required: false,		type: Number,
		default: () => undefined,
		validator: (value: number) => value === undefined || value >= 0 && value < 101,
	})
	protected value: number;

	protected style : string = '';


	get computedValue()
	{
		return Math.floor(this.value);
	}


	@Watch('side')
	protected OnSideChanged( newValue: number )
	{
		console.log('watch')
		this.side = newValue;
		this.UpdateStyle();
	}

	protected mounted()
	{
		console.log('mounted')
		this.UpdateStyle();
	}

	private UpdateStyle()
	{
		let undeterminateStyle = '';
		{
			const factor = ( this.side / 64 );
			const borderWidth = factor * 6;
			const marginTop = factor * 3;
			undeterminateStyle = `
				width: ${this.side}px;
				height: ${this.side}px;
				margin-top: ${marginTop}px;
				border-width: ${borderWidth}px;
			`;	
		}

		let progressStyle = '';
		{
			const factor = ( this.side / 64 );
			const borderWidth = factor * 6;
			const marginTop = factor * 8;
			progressStyle = `
				width: ${this.side}px;
				height: ${this.side}px;
				margin-top: ${marginTop}px;
				border-width: ${borderWidth}px;
			`;	
		}

		this.style = this.value ? progressStyle : undeterminateStyle;

// progress[value="17"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 17%, var(--background) 17% 100%); }
//		if ( this.value > -1 )
//		{
//			this.style = `${this.style}
//				progress[value="${this.value}"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% ${this.value}%, var(--background) ${this.value}% 100%); }
//			`;
//		}
	}
}

</script>

<style scoped>

/* undeterminate */
	.dual-ring {
		content: "";
		display: block;
		width: 64px;
		height: 64px;
		margin-top: 3px;
		border-radius: 50%;
		border-width: 6px;
		border-style: solid;
		border-color: green transparent green transparent;
		animation: lds-dual-ring 1.5s linear infinite;
	}
	@keyframes lds-dual-ring {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

 /* value */
	progress {
		--color: green;
		--background: lightblue;
		width: 64px;
		height: 64px;
		border-radius: 50%;
		overflow: hidden;
		display: block;
		color: transparent;
		background: transparent;
		margin-left: 6px;
	}
	progress:before {
		content: "";
		background: white;
		z-index:100;
		border-radius:50%;
	}

	progress::-webkit-progress-value { background: transparent; }
	/* GENERATED IN JS BY
	[...new Array(100)].map((_, i) => `progress[value="${i}"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% ${i}%, var(--background) ${i}% 100%); }`).join('\n')
	*/

	progress[value="0"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 0%, var(--background) 0% 100%); }
	progress[value="1"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 1%, var(--background) 1% 100%); }
	progress[value="2"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 2%, var(--background) 2% 100%); }
	progress[value="3"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 3%, var(--background) 3% 100%); }
	progress[value="4"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 4%, var(--background) 4% 100%); }
	progress[value="5"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 5%, var(--background) 5% 100%); }
	progress[value="6"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 6%, var(--background) 6% 100%); }
	progress[value="7"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 7%, var(--background) 7% 100%); }
	progress[value="8"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 8%, var(--background) 8% 100%); }
	progress[value="9"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 9%, var(--background) 9% 100%); }
	progress[value="10"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 10%, var(--background) 10% 100%); }
	progress[value="11"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 11%, var(--background) 11% 100%); }
	progress[value="12"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 12%, var(--background) 12% 100%); }
	progress[value="13"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 13%, var(--background) 13% 100%); }
	progress[value="14"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 14%, var(--background) 14% 100%); }
	progress[value="15"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 15%, var(--background) 15% 100%); }
	progress[value="16"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 16%, var(--background) 16% 100%); }
	progress[value="17"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 17%, var(--background) 17% 100%); }
	progress[value="18"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 18%, var(--background) 18% 100%); }
	progress[value="19"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 19%, var(--background) 19% 100%); }
	progress[value="20"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 20%, var(--background) 20% 100%); }
	progress[value="21"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 21%, var(--background) 21% 100%); }
	progress[value="22"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 22%, var(--background) 22% 100%); }
	progress[value="23"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 23%, var(--background) 23% 100%); }
	progress[value="24"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 24%, var(--background) 24% 100%); }
	progress[value="25"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 25%, var(--background) 25% 100%); }
	progress[value="26"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 26%, var(--background) 26% 100%); }
	progress[value="27"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 27%, var(--background) 27% 100%); }
	progress[value="28"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 28%, var(--background) 28% 100%); }
	progress[value="29"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 29%, var(--background) 29% 100%); }
	progress[value="30"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 30%, var(--background) 30% 100%); }
	progress[value="31"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 31%, var(--background) 31% 100%); }
	progress[value="32"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 32%, var(--background) 32% 100%); }
	progress[value="33"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 33%, var(--background) 33% 100%); }
	progress[value="34"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 34%, var(--background) 34% 100%); }
	progress[value="35"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 35%, var(--background) 35% 100%); }
	progress[value="36"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 36%, var(--background) 36% 100%); }
	progress[value="37"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 37%, var(--background) 37% 100%); }
	progress[value="38"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 38%, var(--background) 38% 100%); }
	progress[value="39"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 39%, var(--background) 39% 100%); }
	progress[value="40"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 40%, var(--background) 40% 100%); }
	progress[value="41"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 41%, var(--background) 41% 100%); }
	progress[value="42"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 42%, var(--background) 42% 100%); }
	progress[value="43"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 43%, var(--background) 43% 100%); }
	progress[value="44"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 44%, var(--background) 44% 100%); }
	progress[value="45"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 45%, var(--background) 45% 100%); }
	progress[value="46"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 46%, var(--background) 46% 100%); }
	progress[value="47"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 47%, var(--background) 47% 100%); }
	progress[value="48"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 48%, var(--background) 48% 100%); }
	progress[value="49"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 49%, var(--background) 49% 100%); }
	progress[value="50"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 50%, var(--background) 50% 100%); }
	progress[value="51"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 51%, var(--background) 51% 100%); }
	progress[value="52"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 52%, var(--background) 52% 100%); }
	progress[value="53"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 53%, var(--background) 53% 100%); }
	progress[value="54"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 54%, var(--background) 54% 100%); }
	progress[value="55"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 55%, var(--background) 55% 100%); }
	progress[value="56"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 56%, var(--background) 56% 100%); }
	progress[value="57"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 57%, var(--background) 57% 100%); }
	progress[value="58"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 58%, var(--background) 58% 100%); }
	progress[value="59"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 59%, var(--background) 59% 100%); }
	progress[value="60"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 60%, var(--background) 60% 100%); }
	progress[value="61"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 61%, var(--background) 61% 100%); }
	progress[value="62"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 62%, var(--background) 62% 100%); }
	progress[value="63"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 63%, var(--background) 63% 100%); }
	progress[value="64"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 64%, var(--background) 64% 100%); }
	progress[value="65"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 65%, var(--background) 65% 100%); }
	progress[value="66"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 66%, var(--background) 66% 100%); }
	progress[value="67"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 67%, var(--background) 67% 100%); }
	progress[value="68"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 68%, var(--background) 68% 100%); }
	progress[value="69"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 69%, var(--background) 69% 100%); }
	progress[value="70"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 70%, var(--background) 70% 100%); }
	progress[value="71"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 71%, var(--background) 71% 100%); }
	progress[value="72"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 72%, var(--background) 72% 100%); }
	progress[value="73"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 73%, var(--background) 73% 100%); }
	progress[value="74"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 74%, var(--background) 74% 100%); }
	progress[value="75"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 75%, var(--background) 75% 100%); }
	progress[value="76"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 76%, var(--background) 76% 100%); }
	progress[value="77"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 77%, var(--background) 77% 100%); }
	progress[value="78"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 78%, var(--background) 78% 100%); }
	progress[value="79"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 79%, var(--background) 79% 100%); }
	progress[value="80"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 80%, var(--background) 80% 100%); }
	progress[value="81"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 81%, var(--background) 81% 100%); }
	progress[value="82"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 82%, var(--background) 82% 100%); }
	progress[value="83"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 83%, var(--background) 83% 100%); }
	progress[value="84"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 84%, var(--background) 84% 100%); }
	progress[value="85"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 85%, var(--background) 85% 100%); }
	progress[value="86"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 86%, var(--background) 86% 100%); }
	progress[value="87"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 87%, var(--background) 87% 100%); }
	progress[value="88"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 88%, var(--background) 88% 100%); }
	progress[value="89"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 89%, var(--background) 89% 100%); }
	progress[value="90"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 90%, var(--background) 90% 100%); }
	progress[value="91"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 91%, var(--background) 91% 100%); }
	progress[value="92"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 92%, var(--background) 92% 100%); }
	progress[value="93"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 93%, var(--background) 93% 100%); }
	progress[value="94"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 94%, var(--background) 94% 100%); }
	progress[value="95"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 95%, var(--background) 95% 100%); }
	progress[value="96"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 96%, var(--background) 96% 100%); }
	progress[value="97"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 97%, var(--background) 97% 100%); }
	progress[value="98"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 98%, var(--background) 98% 100%); }
	progress[value="99"]::-webkit-progress-bar { background: conic-gradient(var(--color) 0% 99%, var(--background) 99% 100%); }
	progress[value="100"]::-webkit-progress-bar { background: var(--color); }

</style>