import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnChanges, OnDestroy,
  OnInit,
  Renderer2, SimpleChanges,
  ViewChild
} from '@angular/core';
import {SukienTonghopComponent} from "@modules/public/features/web-home/sukien-tonghop/sukien-tonghop.component";
import {NhanvatComponent} from "@modules/public/features/web-home/nhanvat/nhanvat.component";
import {DotThiDanhSachService} from "@shared/services/dot-thi-danh-sach.service";
import {DotThiKetQuaService} from "@shared/services/dot-thi-ket-qua.service";
import {NotificationService} from "@core/services/notification.service";
import {ActivatedRoute, Router} from "@angular/router";


@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent implements OnInit, OnChanges,OnDestroy {
  @ViewChild('slider', {static: true}) slider: ElementRef<HTMLDivElement>;
  @HostListener('window:resize', ['$event']) onResize(event: Event): void {
    this.isSmallScreen = window.innerWidth < 500;
    this.minheight500 = window.innerHeight < 500;
  }

  minheight500: boolean = window.innerHeight < 500;
  isSmallScreen: boolean = window.innerWidth < 500;


  unLesson: boolean = false;
  titleNhanvat: string = "Nội dung mặc định";
  slides = [
    {index: 1, img: '/assets/slide/slide1.jpg'},
    {index: 2, img: '/assets/slide/slide2.jpg',},
    {index: 3, img: '/assets/slide/slide3.jpg',},
    {index: 4, img: '/assets/slide/slide4.jpg',},
  ];

  index = 0;
  mode: "DANNHMUC_NGULIEUSO" | "VR360" | "NHANVAT" | "SUKIEN_TONGHOP" | "SEARCH" | "THONGTIN" | "HOME" | "CHUYENDE" | "GIOITHIEU" = "HOME";

  constructor(

    private dotThiDanhSachService: DotThiDanhSachService,
    private dotthiKetquaService: DotThiKetQuaService,
    private notificationService: NotificationService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {
  }
  ngOnChanges(changes: SimpleChanges): void {
    this.unLesson= false;
  }

  ngOnInit() {
    this.unLesson = false;
    const viewMode = this.activatedRoute.snapshot.queryParamMap.has('view-mode') ? this.activatedRoute.snapshot.queryParamMap.get('view-mode') : 'desktop';
    if (viewMode === 'mobile') {
      console.log(viewMode);
      this.unLesson = true;
    }
  }

  ngOnDestroy(): void {
    this.unLesson = false;
  }



  btn_GoHome() {
    this.action_menu = false;
    void this.router.navigate(['home/']);
    this.unLesson = false;
  }

  btn_shift() {
    this.action_menu = false;
    void this.router.navigate(['test/shift/']);
    this.unLesson = false;
  }

  btn_sukien() {
    this.action_menu = false;
    void this.router.navigate(['/home/su-kien/']);
    this.unLesson = false;
  }

  btn_nhanvat() {
    this.action_menu = false;
    void this.router.navigate(['home/nhan-vat/']);
    this.unLesson = false;
  }

  btn_vr360() {
    this.action_menu = false;
    void this.router.navigate(['home/vr-360/']);
    this.unLesson = false;
  }



  btn_31Chuyende() {
    this.action_menu = false;
    this.router.navigate(['/home/chuyen-de/']);
    this.unLesson = true;
  }


  action_menu: boolean = false;

  btnActionMenu() {
    this.action_menu = !this.action_menu;
  }

  btn_search() {
    this.router.navigate(['home/tim-kiem/']);
    this.action_menu = false;
    this.unLesson= false;
  }


  btn_gioithieu() {
    this.router.navigate(['home/gioi-thieu/']);
    this.action_menu = false;
    this.unLesson= false;

  }
  btn_login() {
    this.router.navigate(['login']);
  }

  btn_chuyenmuc(){
    this.router.navigate(['home/chuyen-muc/']);
    this.action_menu = false;
    this.unLesson= false;
  }


}
