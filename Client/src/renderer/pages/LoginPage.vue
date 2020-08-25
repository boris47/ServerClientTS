<template>
	<global-layout>
		<div slot="header">
			<!--div class="logo"/--> 
			<!--img :src="GetStatic('me.jpg')" alt=""-->
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
import { Route, NavigationGuardNext } from 'vue-router/types/router';
//	import { ICP_RendererComs } from '../icpRendererComs';
//	import { EComunicationsChannels } from '../../icpComs';

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

		async beforeRouteEnter( to: Route, from: Route, next: NavigationGuardNext<Vue> )
		{
			next( async (vn: Vue) =>
			{
				});
		},

		async created()
		{
			console.log('LoginPage');
			const bResult = await LoginManager.TryAutoLogin();
			if (bResult)
			{
				AppRouter.NavigateTo('testPage');
			}

	/*		const result = await ICP_RendererComs.Invoke(EComunicationsChannels.FILE_READ, null, 'TestStatic.txt' );
			if ( Buffer.isBuffer(result) )
			{
				console.log('Static: Content,', result.toString());
			}
			else
			{
				console.error('Static: Error,', result);
			}
	*/	},

		methods:
		{
			handleSubmit()
			{
				this.submitted = true;
				if (this.username && this.password)
				{
					LoginManager.Trylogin( this.username, this.password );
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
		/* cursor: help; */
		/* cursor: url('../../../static/smallcursor.png') 2 2, pointer; */
	}

	/* .logo {
		background: url('../../../static/me.jpg') 100% 100% no-repeat, blue;
		height: 100px;
		width: 300px;
    } */

</style>