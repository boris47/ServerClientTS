<template>
	<global-layout>
		<div slot="main">
			<h3>Login</h3>
			<v-form>
				<v-text-field :disabled="submitted" :loading="submitted" :rules="textFiledsRules"
					v-model="username"
					label="Username"
					type="text"
					v-on:keyup.enter="handleSubmit"
				/>
				<div>
				<v-text-field :disabled="submitted" :loading="submitted" :rules="textFiledsRules"
					v-model="password"
					label="Password"
					:type="visible ? 'text' : 'password'"
					v-on:keyup.enter="handleSubmit"
					hint="Insert the password"
					:append-icon="visible ? 'mdi-eye' : 'mdi-eye-off'"
					v-on:click:append="visible = !visible"
				/>
				</div>
			</v-form>
			<div>
				<v-btn :disabled="submitted" :loading="submitted" v-on:click.stop="handleSubmit">Login</v-btn>
				<v-btn :disabled="submitted" v-on:click.stop="GoToRegisterPage">Register</v-btn>
			</div>
		</div>
	</global-layout>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import AppRouter from '../appRouter';
import LoginManager from '../plugins/loginManager';
import { Route, NavigationGuardNext } from 'vue-router/types/router';

@Component
export default class LoginPage extends Vue
{
	protected username: string = '';
	protected password: string = '';
	protected visible: boolean = false;
	protected submitted: boolean = false;
	protected textFiledsRules =
	[
		(value: string) => !!value || 'Required.'
	];

	protected beforeRouteEnter(to: Route, from: Route, next: NavigationGuardNext<Vue>)
	{
		next( async (vn: Vue) =>
		{
		});
	}

	protected async created()
	{
		console.log('LoginPage');
		const bResult = await LoginManager.TryAutoLogin();
		if (bResult)
		{
			AppRouter.NavigateTo('testPage');
		}
	}

	protected async handleSubmit()
	{
		if (this.username && this.password && !this.submitted)
		{
			this.submitted = true;
			const result = await LoginManager.Trylogin( this.username, this.password );
			if (!result)
			{
				this.submitted = false;
			}
		}
	}

	protected GoToRegisterPage()
	{
		AppRouter.NavigateTo('registrationPage');
	}
}
</script>

<style scoped>

</style>