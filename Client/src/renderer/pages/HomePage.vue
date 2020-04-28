<template>
	<global-layout>
		<div slot="header">
			<p>Home Page!</p>
			<button type="button" @click.stop="GoToLoginPage">Login</button>
			<button type="button" @click.stop="SetValue">Set value</button>
			<h1 v-if="bRequestSucceded===true">SUCCESS</h1>
			<h1 v-if="bRequestSucceded===false">FAIL</h1>
			<h1 v-if="bRequestSucceded===null">WAITING</h1>
		</div>
	</global-layout>
</template>

<script lang="ts">

	import Vue from 'vue';
	import AppRouter from '../appRouter';
	import { ICP_RendererComs } from '../icpRendererComs';
	import { EComunications } from '../../icpComs';

	export default Vue.extend( {

		name: "HomePage",
		data: function() {
			return {bRequestSucceded: null}
		},

		created()
		{
			console.log( 'HomePage' );
		},

		methods: {

			GoToLoginPage()
			{
				AppRouter.NavigateTo('loginPage');
			},

			SetValue()
			{
				ICP_RendererComs.Invoke<boolean>( EComunications.REQ_PUT, 'keyy', 'Valueeee' ).then( b => this.bRequestSucceded = b );
			}
		}
	} )

</script>