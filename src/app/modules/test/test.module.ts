import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TestRoutingModule } from './test-routing.module';
import { ShiftComponent } from './shift/shift.component';
import { PanelComponent } from './panel/panel.component';
import { RippleModule } from 'primeng/ripple';
import { ButtonModule } from 'primeng/button';
import { SharedModule } from '@shared/shared.module';
import { DialogModule } from 'primeng/dialog';
import { FormsModule , ReactiveFormsModule } from '@angular/forms';
import { GroupsRadioComponent } from './panel/groups-radio/groups-radio.component';
import { InputMaskModule } from 'primeng/inputmask';
import { ContestantComponent } from './contestant/contestant.component';

@NgModule( {
	declarations : [
		ShiftComponent ,
		PanelComponent ,
		GroupsRadioComponent ,
		ContestantComponent
	] ,
	exports      : [
		GroupsRadioComponent
	] ,
	imports      : [
		CommonModule ,
		TestRoutingModule ,
		RippleModule ,
		ButtonModule ,
		SharedModule ,
		DialogModule ,
		ReactiveFormsModule ,
		FormsModule ,
		InputMaskModule
	]
} )
export class TestModule {}
