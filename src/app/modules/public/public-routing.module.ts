import { NgModule } from '@angular/core';
import { RouterModule , Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { LoginV2Component } from './features/login-v2/login-v2.component';
import { ContentNoneComponent } from './features/content-none/content-none.component';
import { UnauthorizedComponent } from './features/unauthorized/unauthorized.component';
import { ClearComponent } from './features/clear/clear.component';
import { TestComponent } from '@modules/public/features/test/test.component';
import { LoginVideoComponent } from '@modules/public/features/login-video/login-video.component';

const routes : Routes = [
	{
		path      : 'test' ,
		component : TestComponent
	} ,
	{
		path      : 'unauthorized' ,
		component : UnauthorizedComponent
	} ,
	{
		path      : 'clear' ,
		component : ClearComponent
	} ,
	{
		path      : 'login' ,
		component : LoginComponent
	} ,
	{
		path      : 'login-video' ,
		component : LoginVideoComponent
	} ,
	{
		path      : 'login-2' ,
		component : LoginV2Component
	} ,
	{
		path      : 'content-none' ,
		component : ContentNoneComponent
	} ,
	{
		path         : 'basic' ,
		loadChildren : () => import('./features/basic/basic.module').then( m => m.BasicModule )
	} ,
	{
		path       : '' ,
		redirectTo : 'login' ,
		pathMatch  : 'prefix'
	} ,
	{
		path       : '**' ,
		redirectTo : 'content-none' ,
		pathMatch  : 'prefix'
	}
];

@NgModule( {
	imports : [ RouterModule.forChild( routes ) ] ,
	exports : [ RouterModule ]
} )
export class PublicRoutingModule {}
