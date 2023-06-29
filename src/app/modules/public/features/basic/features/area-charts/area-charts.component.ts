import { Component , ViewChild , OnInit } from '@angular/core';
import {
	ChartComponent ,
	ApexChart ,
	ApexAxisChartSeries ,
	ApexTitleSubtitle ,
	ApexDataLabels ,
	ApexFill ,
	ApexYAxis ,
	ApexXAxis ,
	ApexTooltip ,
	ApexMarkers ,
	ApexAnnotations ,
	ApexStroke
} from 'ng-apexcharts';

export type ChartOptions = {
	series : ApexAxisChartSeries;
	chart : ApexChart;
	dataLabels : ApexDataLabels;
	markers : ApexMarkers;
	title : ApexTitleSubtitle;
	fill : ApexFill;
	yaxis : ApexYAxis;
	xaxis : ApexXAxis;
	tooltip : ApexTooltip;
	stroke : ApexStroke;
	annotations : ApexAnnotations;
	colors : any;
	toolbar : any;
};

@Component( {
	selector    : 'app-area-charts' ,
	templateUrl : './area-charts.component.html' ,
	styleUrls   : [ './area-charts.component.css' ]
} )
export class AreaChartsComponent implements OnInit {

	constructor() { }

	ngOnInit() : void {
	}

}
