import { NgModule } from '@angular/core';
import { RouterModule , Routes } from '@angular/router';
import { ShowCaseComponent } from './features/show-case/show-case.component';
import { AreaChartsComponent } from './features/area-charts/area-charts.component';
import { ButtonsComponent } from './features/buttons/buttons.component';
import { LoaderComponent } from './features/loader/loader.component';
import { ColorPanelComponent } from './features/color-panel/color-panel.component';
import { LadingPageComponent } from './lading-page/lading-page.component';

const routes : Routes = [
	{
		path      : 'landing' ,
		component : LadingPageComponent
	} ,
	{
		path      : 'show-case' ,
		component : ShowCaseComponent
	} ,
	{
		path      : 'area-charts' ,
		component : AreaChartsComponent
	} ,
	{
		path      : 'buttons' ,
		component : ButtonsComponent
	} ,
	{
		path      : 'loading' ,
		component : LoaderComponent
	} ,
	{
		path      : 'color-panel' ,
		component : ColorPanelComponent
	} ,
	{
		path       : '**' ,
		redirectTo : 'landing'
	}
];

@NgModule( {
	imports : [ RouterModule.forChild( routes ) ] ,
	exports : [ RouterModule ]
} )
export class BasicRoutingModule {}
