import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {state, style, trigger} from "@angular/animations";
import {NotificationService} from "@core/services/notification.service";
import {ActivatedRoute, ParamMap, Router} from "@angular/router";
import {ChuyenDe} from "@shared/models/quan-ly-chuyen-de";
import {BUTTON_NO, BUTTON_YES} from "@core/models/buttons";

@Component({
  selector: 'app-mobile-chuyen-de',
  templateUrl: './mobile-chuyen-de.component.html',
  styleUrls: ['./mobile-chuyen-de.component.css'],
  animations  : [
    trigger( 'mobileMenu' , [
      state( 'open' , style( { 'left' : '0' } ) ) ,
      state( 'close' , style( { 'left' : 'var(--ictu-learning-board-left-section--offset, -400px)' } ) )
    ] ) ,
    trigger( 'layout' , [
      state( 'expanded' , style( {
        'width'       : 'calc( 100% + var(--ictu-learning-board-left-section--size,400px) )' ,
        'margin-left' : 'var(--ictu-learning-board-left-section--offset,-400px)'
      } ) ) ,
      state( 'minimal' , style( {
        'width'       : '100%' ,
        'margin-left' : '0'
      } ) )
    ] )
  ]
})
export class MobileChuyenDeComponent implements OnInit {
  @Output() eventEmitter = new EventEmitter<void>();
  // @ViewChild( WebHomeComponent)webHomeComponent:WebHomeComponent;

  constructor(
    private notificationService:NotificationService,
    private router:Router,
    private activatedRoute:ActivatedRoute
  ) {}

  loading : boolean = true;	expandLayout : boolean = false;

  listData: ChuyenDe[];
  mobileMenu : 'open' | 'close' = 'close';

  toggleMenuMobile() {
    this.mobileMenu = this.mobileMenu !== 'open' ? 'open' : 'close';
  }

  closeMenuMobile() {
    this.mobileMenu = 'close';
  }

  toggleExpandLayout() {
    this.expandLayout = !this.expandLayout;
  }

  chuyende_id_param:number;
  ngOnInit(): void {
    const params: ParamMap = this.activatedRoute.snapshot.queryParamMap;
    const id: number = params.has('param') ? Number(params.get('param')) : NaN;
    if (!Number.isNaN(id)) {
      this.chuyende_id_param = id;
      this.toggleMenuMobile();
    }

  }

  sharedData: any;

  passData(data: any) {
    this.sharedData = data;
  }
  async backHome(){

    const button = await this.notificationService.confirmRounded('<p class="text-danger">Xác nhận</p>','Trở lại trang chủ',[BUTTON_YES,BUTTON_NO]);
    if(button.name === BUTTON_YES.name){
      void this.router.navigate(['mobile/']);
    }
    this.eventEmitter.emit();
  }
}
