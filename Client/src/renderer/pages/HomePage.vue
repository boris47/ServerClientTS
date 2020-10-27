<template>
	<global-layout>
		<div slot="header">
			<p>Home Page!</p>
			<!--button type="button" @click.stop="GoToLoginPage">Login</button-->
		</div>
	</global-layout>
</template>

<script lang="ts">

import Vue from 'Vue'
import Component from 'vue-class-component'
import AppRouter from '../appRouter';

@Component
export default class HomePage extends Vue
{
	protected SelectedFileAbsolutePath: string = '';

	protected created()
	{
		console.log('HomePage');
	}

	protected GoToLoginPage()
	{
		AppRouter.NavigateTo('loginPage');
	}
	
}

</script>