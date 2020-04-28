<template>
	<global-layout>
		<div slot="header">
			<h3>Login</h3>
			<form v-on:submit.prevent="handleSubmit">
				<div>
					<label>Username</label>
					<input type="text" v-model="username" name="username"/>
					<div v-show="submitted && !username">Username is required</div>
				</div>
				<div>
					<label>Password</label>
					<input type="password" v-model="password" name="password"/>
					<div v-show="submitted && !password">Password is required</div>
				</div>
				<div>
					<button class="btn btn-primary">Login</button>
				</div>
			</form>
		</div>
	</global-layout>
</template>

<script lang="ts">

	import Vue from 'vue';
	import AppRouter from '../appRouter';
	import LoginManager from '../plugins/loginManager';

	export default Vue.extend( {

		name: "LoginPage",
		data()
		{
			return {
				username: '',
				password: '',
				submitted: false
			};
		},

		created()
		{
			console.log( 'LoginPage' );
			LoginManager.IsLogged = false;
		},

		methods: {

			handleSubmit( e : any )
			{
				this.submitted = true;
				const { username, password } = this;
				if ( username && password )
				{
					console.log( username, password );
					LoginManager.IsLogged = true;
					AppRouter.NavigateTo( 'entrancePage' );
				}
			}
			
		}
	} )

</script>