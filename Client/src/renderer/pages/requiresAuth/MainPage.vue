<template>
	<global-layout>
		<div slot="header">
		</div>
		<template slot="main">
            <router-view/>
        </template>
	</global-layout>
</template>

<script lang="ts">

	import Vue from 'vue';

	export default Vue.extend( {

		name: "MainPage",

		created()
		{
			console.log( 'MainPage' );
		},

		methods: {

		}
	} )

</script>