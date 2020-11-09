<template>
	<global-layout>
		<div slot="header">
			<h3>Registration</h3>
			<form v-on:submit.prevent="handleSubmit">
				<div>
					<v-text-field label="Username" type="text" :rules="textFiledsRules" v-model="username" name="username" />
				</div>
				<div>
					<v-text-field label="Password" type="password" :rules="textFiledsRules" v-model="password" name="password" />
				</div>
				<v-btn>Register</v-btn>
			</form>
		</div>
	</global-layout>
</template>

<script lang="ts">

	import { Component, Vue } from 'vue-property-decorator';
	import AppRouter from '../appRouter';
	import { ICP_RendererComs } from '../icpRendererComs';
	import { EComunicationsChannels } from '../../icpComs';
	

	@Component
	export default class RegistrationPage extends Vue
	{
		protected username: string = '';
		protected password: string = '';
		protected submitted: boolean = false;
		protected textFiledsRules =
		[
			(value: string) => !!value || 'Required.'
		];

		protected created()
		{
			console.log('RegistrationPage');
		}

		protected async handleSubmit()
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

</script>

<style scoped>

.red-label{
	color: red;
}

</style>