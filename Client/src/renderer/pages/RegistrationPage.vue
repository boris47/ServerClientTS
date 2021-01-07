<template>
	<global-layout>
		<div slot="main">
			<h3>Registration</h3>
			<v-form>
				<v-text-field :disabled="submitted" :loading="submitted" :rules="textFiledsRules"
					v-model="username"
					label="Username"
					type="text"
					v-on:keyup.enter="HandleSubmit"
				/>
				<div>
				<v-text-field :disabled="submitted" :loading="submitted" :rules="textFiledsRules"
					v-model="password"
					label="Password"
					:type="visible ? 'text' : 'password'"
					v-on:keyup.enter="HandleSubmit"
					hint="Insert the password"
					:append-icon="visible ? 'mdi-eye' : 'mdi-eye-off'"
					v-on:click:append="visible = !visible"
				/>
				</div>
			</v-form>
			<div>
				<v-btn :disabled="submitted" :loading="submitted" v-on:click.stop="HandleSubmit">Register User</v-btn>
				<v-btn :disabled="submitted" :loading="submitted" v-on:click.stop="GoToLoginPage">Back</v-btn>
			</div>
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

	protected GoToLoginPage()
	{
		AppRouter.NavigateTo('loginPage');
	}

	protected async HandleSubmit()
	{
		if (this.username && this.password && !this.submitted)
		{
			this.submitted = true;
			const result = await ICP_RendererComs.Request(EComunicationsChannels.REQ_USER_REGISTER, null, this.username, this.password);
			if (Buffer.isBuffer(result))
			{
				AppRouter.NavigateTo('loginPage');
			}
			else
			{
				this.submitted = false;
				console.error("Login Failed", result);
			}
		}
	}
}
</script>

<style scoped>

</style>