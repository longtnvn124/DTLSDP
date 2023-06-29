import { Component , OnInit } from '@angular/core';

@Component( {
	selector    : 'app-color-panel' ,
	templateUrl : './color-panel.component.html' ,
	styleUrls   : [ './color-panel.component.css' ]
} )
export class ColorPanelComponent implements OnInit {

	colorPanel = [
		{
			label  : 'blue' ,
			prefix : '--blue-' ,
			value  : [ '900' , '800' , '700' , '600' , '500' , '400' , '300' , '200' , '100' , '50' ]
		} ,
		{
			label  : 'green' ,
			prefix : '--green-' ,
			value  : [ '900' , '800' , '700' , '600' , '500' , '400' , '300' , '200' , '100' , '50' ]
		} ,
		{
			label  : 'yellow' ,
			prefix : '--yellow-' ,
			value  : [ '900' , '800' , '700' , '600' , '500' , '400' , '300' , '200' , '100' , '50' ]
		} ,
		{
			label  : 'cyan' ,
			prefix : '--cyan-' ,
			value  : [ '900' , '800' , '700' , '600' , '500' , '400' , '300' , '200' , '100' , '50' ]
		} ,
		{
			label  : 'pink' ,
			prefix : '--pink-' ,
			value  : [ '900' , '800' , '700' , '600' , '500' , '400' , '300' , '200' , '100' , '50' ]
		} ,
		{
			label  : 'indigo' ,
			prefix : '--indigo-' ,
			value  : [ '900' , '800' , '700' , '600' , '500' , '400' , '300' , '200' , '100' , '50' ]
		} ,
		{
			label  : 'teal' ,
			prefix : '--teal-' ,
			value  : [ '900' , '800' , '700' , '600' , '500' , '400' , '300' , '200' , '100' , '50' ]
		} ,
		{
			label  : 'orange' ,
			prefix : '--orange-' ,
			value  : [ '900' , '800' , '700' , '600' , '500' , '400' , '300' , '200' , '100' , '50' ]
		} ,
		{
			label  : 'blue-gray' ,
			prefix : '--blue-gray-' ,
			value  : [ '900' , '800' , '700' , '600' , '500' , '400' , '300' , '200' , '100' , '50' ]
		} ,
		{
			label  : 'purple' ,
			prefix : '--purple-' ,
			value  : [ '900' , '800' , '700' , '600' , '500' , '400' , '300' , '200' , '100' , '50' ]
		} ,
		{
			label  : 'red' ,
			prefix : '--red-' ,
			value  : [ '900' , '800' , '700' , '600' , '500' , '400' , '300' , '200' , '100' , '50' ]
		}
	];

	cssBgClass = [
		{
			label  : 'red' ,
			prefix : 'bg-red-' ,
			value  : [ '900' , '800' , '700' , '600' , '500' , '400' , '300' , '200' , '100' ]
		} ,

		{
			label  : 'pink' ,
			prefix : 'bg-pink-' ,
			value  : [ '900' , '800' , '700' , '600' , '500' , '400' , '300' , '200' , '100' ]
		}
		, {
			label  : 'purple' ,
			prefix : 'bg-purple-' ,
			value  : [ '900' , '800' , '700' , '600' , '500' , '400' , '300' , '200' , '100' ]
		}
		, {
			label  : 'indigo' ,
			prefix : 'bg-indigo-' ,
			value  : [ '900' , '800' , '700' , '600' , '500' , '400' , '300' , '200' , '100' ]
		}
		, {
			label  : 'blue' ,
			prefix : 'bg-blue-' ,
			value  : [ '900' , '800' , '700' , '600' , '500' , '400' , '300' , '200' , '100' ]
		}
		, {
			label  : 'cyan' ,
			prefix : 'bg-cyan-' ,
			value  : [ '900' , '800' , '700' , '600' , '500' , '400' , '300' , '200' , '100' ]
		}
		, {
			label  : 'teal' ,
			prefix : 'bg-teal-' ,
			value  : [ '900' , '800' , '700' , '600' , '500' , '400' , '300' , '200' , '100' ]
		}
		, {
			label  : 'green' ,
			prefix : 'bg-green-' ,
			value  : [ '900' , '800' , '700' , '600' , '500' , '400' , '300' , '200' , '100' ]
		}
		, {
			label  : 'light-green' ,
			prefix : 'bg-light-green-' ,
			value  : [ '900' , '800' , '700' , '600' , '500' , '400' , '300' , '200' , '100' ]
		}
		, {
			label  : 'yellow' ,
			prefix : 'bg-yellow-' ,
			value  : [ '900' , '800' , '700' , '600' , '500' , '400' , '300' , '200' , '100' ]
		}
		, {
			label  : 'orange' ,
			prefix : 'bg-orange-' ,
			value  : [ '900' , '800' , '700' , '600' , '500' , '400' , '300' , '200' , '100' ]
		}
		, {
			label  : 'brown' ,
			prefix : 'bg-brown-' ,
			value  : [ '900' , '800' , '700' , '600' , '500' , '400' , '300' , '200' , '100' ]
		}
		, {
			label  : 'grey' ,
			prefix : 'bg-grey-' ,
			value  : [ '900' , '800' , '700' , '600' , '500' , '400' , '300' , '200' , '100' ]
		}
		, {
			label  : 'blue-grey' ,
			prefix : 'bg-blue-grey-' ,
			value  : [ '900' , '800' , '700' , '600' , '500' , '400' , '300' , '200' , '100' ]
		}
	];

	cssColorClass = [
		{
			label  : 'red' ,
			prefix : 'red-' ,
			value  : [ '900' , '800' , '700' , '600' , '500' , '400' , '300' , '200' , '100' ]
		}
	];

	constructor() { }

	ngOnInit() : void {
	}

}
