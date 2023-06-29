import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BasicRoutingModule } from './basic-routing.module';
import { LadingPageComponent } from './lading-page/lading-page.component';

import { AreaChartBasicComponent } from './features/area-chart-basic/area-chart-basic.component';
import { AreaChartsComponent } from './features/area-charts/area-charts.component';
import { ShowCaseComponent } from './features/show-case/show-case.component';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ButtonsComponent } from './features/buttons/buttons.component';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ConfirmationService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { SidebarModule } from 'primeng/sidebar';
import { TooltipModule } from 'primeng/tooltip';
import { OvicSvgModule } from '@modules/ovic-svg/ovic-svg.module';
import { LoaderComponent } from './features/loader/loader.component';
import { SharedModule } from '@shared/shared.module';
import { ColorPanelComponent } from './features/color-panel/color-panel.component';

@NgModule( {
	declarations : [
		LadingPageComponent ,
		AreaChartBasicComponent ,
		AreaChartsComponent ,
		ShowCaseComponent ,
		ButtonsComponent ,
		LoaderComponent ,
		ColorPanelComponent
	] ,
	imports      : [
		CommonModule ,
		NgApexchartsModule ,
		ButtonModule ,
		RippleModule ,
		ConfirmPopupModule ,
		DialogModule ,
		SidebarModule ,
		TooltipModule ,
		OvicSvgModule ,
		SharedModule ,
		BasicRoutingModule
	] ,
	providers    : [
		ConfirmationService
	]
} )
export class BasicModule {}
