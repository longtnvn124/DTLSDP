import { NgModule } from '@angular/core';
import { RouterModule , Routes } from '@angular/router';
import { ShiftComponent } from '@modules/test/shift/shift.component';
import { PanelComponent } from '@modules/test/panel/panel.component';
import { TestGuard } from '@modules/test/guards/test.guard';
import { ContestantComponent } from '@modules/test/contestant/contestant.component';

const routes : Routes = [
	{
		path      : 'shift' ,
		component : ShiftComponent ,
		data      : { state : 'test--shift' }
	} ,
	{
		path        : 'panel' ,
		component   : PanelComponent ,
		canActivate : [ TestGuard ] ,
		data        : { state : 'test--panel' }
	} ,
	{
		path        : 'contestant' ,
		component   : ContestantComponent ,
		data        : { state : 'test--contestant' }
	} ,
	{
		path       : '**' ,
		redirectTo : 'shift' ,
		pathMatch  : 'prefix'
	}

];

@NgModule( {
	imports : [ RouterModule.forChild( routes ) ] ,
	exports : [ RouterModule ]
} )
export class TestRoutingModule {
}
