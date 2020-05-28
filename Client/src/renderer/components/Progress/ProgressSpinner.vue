<template>
	<div width="120px" height="120px">
		<div class="lds-dual-ring"></div>
	</div>
</template>

<script lang="ts">

import { Component, Vue } from 'vue-property-decorator';

@Component
export default class ProgressSpinner extends Vue
{
	
}

</script>

<style scoped>

.lds-dual-ring {
	display: inline-block;
	width: 20px;
	height: 20px;
}
.lds-dual-ring:after {
	content: " ";
	display: block;
	width: 14px;
	height: 14px;
	border-radius: 50%;
	border: 6px solid rgb(5, 165, 0);
	border-color: rgb(5, 165, 0) transparent #fff transparent;
	animation: lds-dual-ring 1.0s linear infinite;
}
@keyframes lds-dual-ring {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}


</style>