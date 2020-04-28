<template>
	<global-layout>
		<div slot="main">
			<h4>LOGGED IN</h4>
		</div>
	</global-layout>
</template>

<script lang="ts">

	import Vue from 'vue';

	export default Vue.extend( {

		name: "EntrancePage",

		created()
		{
			console.log( 'EntrancePage' );
		},
		
	})

</script>