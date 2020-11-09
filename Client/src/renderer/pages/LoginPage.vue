<template>
	<global-layout>
		<div slot="main">
			<div class="logo"/> 
			<img :src="GetStatic('me.jpg')" alt="">
			<h3>Login</h3>
			<form v-on:submit.prevent="handleSubmit">
				<div>
					<v-text-field label="Username" type="text" :rules="textFiledsRules" v-model="username" name="username" />
				</div>
				<div>
					<v-text-field label="Password" type="password" :rules="textFiledsRules" v-model="password" name="password" />
				</div>
				<v-btn>Login</v-btn>
			</form>
			<v-btn v-on:click.stop="GoToRegisterPage">Register</v-btn>
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

		protected handleSubmit()
		{
			if (this.username && this.password)
			{
				this.submitted = true;
				LoginManager.Trylogin( this.username, this.password );
			}
		}

		protected GoToRegisterPage()
		{
			AppRouter.NavigateTo('registrationPage');
		}
	}

</script>

<style scoped>

	.red-label{
		color: red;
		/* cursor: help; */
		/* cursor: url('../../../static/smallcursor.png') 2 2, pointer; */
	}

	/* .logo {
		background: url('../../../static/me.jpg') 100% 100% no-repeat, blue;
		height: 100px;
		width: 300px;
    } */

</style>