import { Component , Host , HostListener , OnInit } from '@angular/core';

interface windowObject {
	innerWidth : number,
	innerHeight : number
}

@Component( {
	selector    : 'app-login-video' ,
	templateUrl : './login-video.component.html' ,
	styleUrls   : [ './login-video.component.css' ]
} )
export class LoginVideoComponent implements OnInit {

	@HostListener( 'window:resize' , [ '$event' ] ) onResize( event ) {
		this.videoSize = event.target;
	};

	video = { width : 1902 , height : 1080 };

	ratio = 16 / 9;

	constructor() {
		this.videoSize = window;
	}

	ngOnInit() : void {
	}

	set videoSize( { innerWidth , innerHeight } : windowObject ) {
		const videoHeight = innerWidth * 9 / 16;
		if ( videoHeight >= innerHeight ) {
			this.video.height = videoHeight;
			this.video.width  = innerWidth;
		} else {
			this.video.height = innerHeight;
			this.video.width  = innerHeight * 16 / 9;
		}
	}

}
