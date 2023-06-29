import { Component , ElementRef , OnInit , TemplateRef , ViewChild } from '@angular/core';
import { NotificationService } from '@core/services/notification.service';
import { ConfirmationService } from 'primeng/api';
import { BUTTON_CANCEL , BUTTON_SAVE } from '@core/models/buttons';
import { NgbActiveOffcanvas , NgbOffcanvas , NgbOffcanvasOptions } from '@ng-bootstrap/ng-bootstrap';

@Component( {
	selector    : 'app-show-case' ,
	templateUrl : './show-case.component.html' ,
	styleUrls   : [ './show-case.component.css' ]
} )
export class ShowCaseComponent implements OnInit {

	visibleSidebar1;

	visibleSidebar2;

	visibleSidebar3;

	visibleSidebar4;

	visibleSidebar5;

	@ViewChild( 'ngBtemplate' ) ngBtemplate : TemplateRef<ElementRef>;

	constructor(
		private confirmationService : ConfirmationService ,
		private notificationService : NotificationService ,
		private ngbOffcanvas : NgbOffcanvas ,
		public offcanvas : NgbActiveOffcanvas
	) { }

	ngOnInit() : void {
	}

	confirms() {
		const mes = '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>';
		this.notificationService.confirm( mes , 'Xác nhận thao tác' , [ BUTTON_SAVE , BUTTON_CANCEL ] ).then(
			res => console.log( res ) ,
			reject => console.log( reject )
		);
	}

	confirmRounded() {
		this.notificationService.confirmRounded( '<p class="text-success">Đây là nội dung của cuộc khảo sát<p>' , 'Xác nhận thao tác' ).then(
			res => console.log( res ) ,
			reject => console.log( reject )
		);
	}

	confirmDelete() {
		this.notificationService.confirmDelete().then(
			c => console.log( c ) ,
			r => console.log( r )
		);
	}

	confirm( event : Event ) {
		const target : EventTarget | undefined = event.target === undefined ? undefined : event.target;
		this.confirmationService.confirm( {
			target  : target ,
			message : 'Are you sure that you want to proceed?' ,
			icon    : 'pi pi-exclamation-triangle' ,
			accept  : () => {
				//confirm action
			} ,
			reject  : () => {
				//reject action
			}
		} );
	}

	async openBoostrapCanvas() {
		const options : NgbOffcanvasOptions = { position : 'start' };
		const result                        = await this.ngbOffcanvas.open( this.ngBtemplate , options ).result;
		console.log( result );
	}

}
