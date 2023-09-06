import {AfterViewInit, Component, ElementRef, HostListener, OnInit, Renderer2, ViewChild} from '@angular/core';
import {forkJoin} from "rxjs";
import {DotThiDanhSachService} from "@shared/services/dot-thi-danh-sach.service";
import {DotThiKetQuaService} from "@shared/services/dot-thi-ket-qua.service";
import {Shift, ShiftTests} from "@shared/models/quan-ly-doi-thi";
import {NotificationService} from "@core/services/notification.service";
import {Router} from "@angular/router";
import {SukienTonghopComponent} from "@modules/public/features/web-home/sukien-tonghop/sukien-tonghop.component";


@Component({
  selector: 'app-web-home',
  templateUrl: './web-home.component.html',
  styleUrls: ['./web-home.component.css']
})


export class WebHomeComponent implements OnInit, AfterViewInit {
  @ViewChild('slider', {static: true}) slider: ElementRef<HTMLDivElement>;
  @ViewChild(SukienTonghopComponent) sukienTonghopComponent: SukienTonghopComponent;
  @HostListener('window:scroll', []) onWindowScroll() {
    const header = document.getElementById('header');
    if (window.pageYOffset > 100) {
      this.renderer.addClass(header, 'header-scrolled');
    } else {
      this.renderer.removeClass(header, 'header-scrolled');
    }
  }

  slides = [
    {index: 1, img: '/assets/slide/slide1.jpg'},
    {index: 2, img: '/assets/slide/slide2.jpg',}
  ];


  index = 0;
  mode: "CHUYENMUC" | "DANNHMUC_NGULIEUSO" | "NHANVAT" | "SUKIEN_TONGHOP" | "SEARCH" | "THONGTIN" | "HOME" = "HOME";
  responsiveOptions = [
    {
      breakpoint: '1024px',
      numVisible: 2,
      numScroll: 2
    },
    {
      breakpoint: '768px',
      numVisible: 1,
      numScroll: 1
    },
    {
      breakpoint: '560px',
      numVisible: 1,
      numScroll: 1
    }
  ];

  constructor(
    private renderer: Renderer2,
    private dotThiDanhSachService: DotThiDanhSachService,
    private dotthiKetquaService: DotThiKetQuaService,
    private notificationService: NotificationService,
    private router: Router
  ) {
  }

  ngOnInit() {
    this.loadDotthi();
  }

  ngAfterViewInit() {
  }

  dataShift: Shift[];

  loadDotthi() {
    this.notificationService.isProcessing(true);
    forkJoin<[Shift[], ShiftTests[]]>(this.dotThiDanhSachService.getdataUnlimit(), this.dotthiKetquaService.getdataUnlimit()).subscribe({
      next: ([dataShift, dataShiftTest]) => {
        console.log(dataShiftTest)
        this.dataShift = dataShift.map(m => {
          m['__dataShiftTest'] = dataShiftTest.filter(f => f.shift_id === m.id);
          m['_totalShiftTest'] = m['__dataShiftTest'] ? m['__dataShiftTest'].length : 0;
          m['_time-coverted'] = this.strToTime(m.time_start) +' - '+ this.strToTime(m.time_end);
          return m;
        })
        console.log(this.dataShift);
        this.notificationService.isProcessing(false);
      },
      error: () => {
        this.notificationService.isProcessing(false);
        this.notificationService.toastError('Mất kết với máy chủ');
      }
    })
  }


  strToTime(input: string): string {
    const date = input ? new Date(input) : null;
    let result = '';
    if (date) {
      result += [date.getDate().toString().padStart(2, '0'), (date.getMonth() + 1).toString().padStart(2, '0'), date.getFullYear().toString()].join('/');
      result += ' ' + [date.getHours().toString().padStart(2, '0'), date.getMinutes().toString().padStart(2, '0')].join(':');
    }
    return result;
  }

  btn_shift(){
    void this.router.navigate(['test/shift/']);
  }
  btn_sukien(){
    this.mode="SUKIEN_TONGHOP";
  }
  btn_nhanvat(){
    this.mode= "NHANVAT";
  }

  btn_exit(){
    this.mode= "HOME";
  }
  btnBackInfoSukien(){
    this.sukienTonghopComponent.btn_backInfo();
  }
  btn_vr360(){

  }

}
