import {AfterViewInit, Component, ElementRef, HostListener, OnInit, Renderer2, ViewChild} from '@angular/core';
import {DotThiDanhSachService} from "@shared/services/dot-thi-danh-sach.service";
import {DotThiKetQuaService} from "@shared/services/dot-thi-ket-qua.service";
import {NotificationService} from "@core/services/notification.service";
import {Router} from "@angular/router";
import {SukienTonghopComponent} from "@modules/public/features/web-home/sukien-tonghop/sukien-tonghop.component";
import {DanhMucLinhVucService} from "@shared/services/danh-muc-linh-vuc.service";
import {NguLieuSuKienService} from "@shared/services/ngu-lieu-su-kien.service";
import {DmLinhVuc} from "@shared/models/danh-muc";
import {Ngulieu, SuKien} from "@shared/models/quan-ly-ngu-lieu";
import {FileService} from "@core/services/file.service";
import {NguLieuDanhSachService} from "@shared/services/ngu-lieu-danh-sach.service";

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
  mode: "CHUYENMUC" | "DANNHMUC_NGULIEUSO" |"VR360"| "NHANVAT" | "SUKIEN_TONGHOP" | "SEARCH" | "THONGTIN" | "HOME" = "HOME";
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
    private router: Router,
    private danhMucLinhVucService:DanhMucLinhVucService,
    private nguLieuSuKienService: NguLieuSuKienService,
    private nguLieuDanhSachService: NguLieuDanhSachService,
    private fileService:FileService
  ) {
  }

  dataLinhvuc:DmLinhVuc[];

  ngOnInit() {
    this.danhMucLinhVucService.getDataUnlimit().subscribe({
      next:data=>{
        this.dataLinhvuc = data;
        if(this.dataLinhvuc ){
          const first = this.dataLinhvuc[0].id;
          this.loaidoituong = first;
          this.loadSukien(first);
          this.linhvucId = first;
          this.loadVr(first);
        }
      },

    })

  }

  ngAfterViewInit() {

  }
  dataSukien:SuKien[];
  loadSukien(id :number){
    this.notificationService.isProcessing(true)
    this.nguLieuSuKienService.getDataBylinhvucAndRoot(id).subscribe({
      next:data=>{
        this.dataSukien= data.map(m=>{
          m['_img_thumbnail'] = m.files ? this.fileService.getPreviewLinkLocalFile(m.files): '';
          return m;
        })
        console.log(this.dataSukien);
        this.notificationService.isProcessing(false);
      },error:()=>{
        this.notificationService.isProcessing(false);
      }
    })
  }
  selectDataSukien(id:number){
    console.log(id);
    this.loaidoituong = id;
    this.loadSukien(id);
  }

  linhvucId:number;
  selectDatavr(id:number){
    this.linhvucId = id;
    this.loadVr(id);
  }
  dataVr:Ngulieu[];
  loadVr(id){

    this.nguLieuDanhSachService.getDataByLinhvucAndRoot(id).subscribe({
      next:(data)=>{
        this.dataVr = data.filter(f=>f.loaingulieu === "video360" || f.loaingulieu ==="image360").map(m=>{
          m['_img_thumbnail']= m.file_thumbnail ? this.fileService.getPreviewLinkLocalFile(m.file_thumbnail) :'';
          return m;
        });
        console.log(this.dataVr);
      },
      error:()=>{
      }
    })
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
    this.mode = "VR360";
  }

  btn_login(){
    this.router.navigate(['login']);
  }
  loaidoituong:number
}
