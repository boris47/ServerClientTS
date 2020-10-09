<template>
	<global-layout>
		<div slot="header">
			<h3>Registration</h3>
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
					<button class="btn btn-primary">Register</button>
				</div>
			</form>
		</div>
	</global-layout>
</template>

<script lang="ts">

	import Vue from 'vue';
	import AppRouter from '../appRouter';
	import { ICP_RendererComs } from '../icpRendererComs';
	import { EComunicationsChannels } from '../../icpComs';

	export default Vue.extend({

		name: "RegistrationPage",
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
			console.log('RegistrationPage');
		},

		methods:
		{
			async handleSubmit()
			{
				this.submitted = true;
				if (this.username && this.password)
				{ // TODO
					const result = await ICP_RendererComs.Request(EComunicationsChannels.REQ_USER_REGISTER, null, this.username, this.password);
					if (Buffer.isBuffer(result))
					{
						console.log('TOKEN', result.toString());
						AppRouter.NavigateTo('loginPage');
					}
					else
					{
						console.error("Login Failed", result);
					}
				}
			}
		}
	});

</script>

<style scoped>

.red-label{
	color: red;
}

</style>