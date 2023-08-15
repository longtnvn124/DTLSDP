import { NgModule } from '@angular/core';
import { RouterModule , Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { LoginV2Component } from './features/login-v2/login-v2.component';
import { ContentNoneComponent } from './features/content-none/content-none.component';
import { UnauthorizedComponent } from './features/unauthorized/unauthorized.component';
import { ClearComponent } from './features/clear/clear.component';
import { LoginVideoComponent } from '@modules/public/features/login-video/login-video.component';
import {VirtualTourComponent} from "@modules/public/features/virtual-tour/virtual-tour.component";
import {ResetPasswordComponent} from "@modules/public/features/reset-password/reset-password.component";

const routes : Routes = [

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
		component : LoginVideoComponent
	} ,
  // {
	// 	path      : 'login' ,
	// 	component : LoginComponent
	// } ,
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
    path      : 'virtual-tour' ,
    component : VirtualTourComponent
  } ,
  {
    path      : 'reset-password' ,
    component : ResetPasswordComponent
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
