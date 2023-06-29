import { Component , OnInit } from '@angular/core';

@Component( {
	selector    : 'app-buttons' ,
	templateUrl : './buttons.component.html' ,
	styleUrls   : [ './buttons.component.css' ]
} )
export class ButtonsComponent implements OnInit {

	isLoading = false;

	timeout? : any;

	constructor() { }

	ngOnInit() : void {

	}

	handleClick( event : any ) {
		console.log( event );
		this.isLoading = true;
		if ( this.timeout ) {
			clearTimeout( this.timeout );
		}
		this.timeout = setTimeout( () => { this.isLoading = false;} , 2000 );
	}

}
