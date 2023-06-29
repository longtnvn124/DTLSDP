import { Component , OnInit } from '@angular/core';
import { NotificationService } from '@core/services/notification.service';

class loader {
	private readonly _type : string;
	private _isLoading = false;
	private source;

	loading() {
		if ( this.source ) {
			clearTimeout( this.source );
		}
		this._isLoading = true;
		this.source     = setTimeout( () => this._isLoading = false , 5000 );
	}

	constructor( type : string ) {
		this._type = type;
	}

	get type() : string {
		return this._type;
	}

	get isLoading() : boolean {
		return this._isLoading;
	}
}

@Component( {
	selector    : 'app-loader' ,
	templateUrl : './loader.component.html' ,
	styleUrls   : [ './loader.component.css' ]
} )
export class LoaderComponent implements OnInit {

	data : loader[] = [];

	isLoading = true;

	constructor(
		private notificationService : NotificationService
	) { }

	ngOnInit() : void {
		for ( let i = 0 ; i < 16 ; i++ ) {
			const type = 'loader_' + ( i + 1 ).toString( 10 ).padStart( 2 , '0' );
			this.data.push( new loader( type ) );
		}
		this.isLoading = false;
	}

	async copyData( load : loader ) {
		await navigator.clipboard.writeText( `[ovicLoader]="${ load.type }"` );
		this.notificationService.toastSuccess( 'Done' , 'Copied' );
	}

}
