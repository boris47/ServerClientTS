<template>
	<global-layout>
		<div slot="header">
			<h3>Login</h3>
			<form v-on:submit.prevent="handleSubmit">
				<div>
					<label>username</label>
					<input type="text" v-model="username" name="username" />
					<div class="red-label" v-show="submitted && !username">username is required</div>
				</div>
				<div>
					<label>Password</label>
					<input type="password" v-model="password" name="password" />
					<div class="red-label" v-show="submitted && !password">Password is required</div>
				</div>
				<div>
					<button class="btn btn-primary">Login</button>
				</div>
			</form>
			<button class="btn btn-primary" v-on:click.stop="GoToRegisterPage">Register</button>
		</div>
	</global-layout>
</template>

<script lang="ts">

	import Vue from 'vue';
	import AppRouter from '../appRouter';
	import LoginManager from '../plugins/loginManager';
	import { ICP_RendererComs } from '../icpRendererComs';
	import { EComunicationsChannels } from '../../icpComs';

	export default Vue.extend({

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
			console.log('LoginPage');
			LoginManager.IsLogged = false;
		},

		methods:
		{
			async handleSubmit()
			{
				this.submitted = true;
				if (this.username && this.password)
				{ // TODO
					const result = await ICP_RendererComs.Invoke(EComunicationsChannels.REQ_LOGIN, null, this.username, this.password);
					if (Buffer.isBuffer(result))
					{
						LoginManager.IsLogged = true;
						console.log('TOKEN', result.toString());
						AppRouter.NavigateTo('entrancePage');
					}
					else
					{
						console.error("Login Failed", result);
					}
				}
			},

			GoToRegisterPage()
			{
				AppRouter.NavigateTo('registrationPage');
			}
		}
	});

</script>

<style scoped>

.red-label{
	color: red;
}

</style>