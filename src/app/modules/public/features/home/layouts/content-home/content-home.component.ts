import {AfterViewInit, Component, ElementRef, HostListener, OnInit, Renderer2, ViewChild} from '@angular/core';
import {SukienTonghopComponent} from "@modules/public/features/web-home/sukien-tonghop/sukien-tonghop.component";
import {NhanvatComponent} from "@modules/public/features/web-home/nhanvat/nhanvat.component";
import {DotThiDanhSachService} from "@shared/services/dot-thi-danh-sach.service";
import {DotThiKetQuaService} from "@shared/services/dot-thi-ket-qua.service";
import {NotificationService} from "@core/services/notification.service";
import {ActivatedRoute, Router} from "@angular/router";
import {FileService} from "@core/services/file.service";
import {DanhMucLinhVucService} from "@shared/services/danh-muc-linh-vuc.service";
import {NguLieuSuKienService} from "@shared/services/ngu-lieu-su-kien.service";
import {NguLieuDanhSachService} from "@shared/services/ngu-lieu-danh-sach.service";
import {AuthService} from "@core/services/auth.service";
import {DmLinhVuc} from "@shared/models/danh-muc";
import {Ngulieu, SuKien} from "@shared/models/quan-ly-ngu-lieu";

@Component({
  selector: 'app-content-home',
  templateUrl: './content-home.component.html',
  styleUrls: ['./content-home.component.css']
})
export class ContentHomeComponent implements OnInit, AfterViewInit {
  @ViewChild('slider', {static: true}) slider: ElementRef<HTMLDivElement>;
  @ViewChild(SukienTonghopComponent) sukienTonghopComponent: SukienTonghopComponent;
  @ViewChild(NhanvatComponent) nhanvatComponent: NhanvatComponent;

  @HostListener('window:scroll', []) onWindowScroll() {
    const header = document.getElementById('header');
    if (window.pageYOffset > 100) {
      this.renderer.addClass(header, 'header-scrolled');
    } else {
      this.renderer.removeClass(header, 'header-scrolled');
    }
  };

  @HostListener('window:resize', ['$event']) onResize(event: Event): void {
    this.isSmallScreen = window.innerWidth < 500;
    this.updateNhanvatContent();
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

  constructor(
    private renderer: Renderer2,
    private dotThiDanhSachService: DotThiDanhSachService,
    private dotthiKetquaService: DotThiKetQuaService,
    private notificationService: NotificationService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private fileService: FileService,
    private danhMucLinhVucService: DanhMucLinhVucService,
    private nguLieuSuKienService: NguLieuSuKienService,
    private nguLieuDanhSachService: NguLieuDanhSachService,
    private authService: AuthService
  ) {
  }

  dataLinhvuc: DmLinhVuc[];

  ngOnInit() {
    this.unLesson = false;
    this.danhMucLinhVucService.getDataUnlimit().subscribe({
      next: data => {
        this.dataLinhvuc = data;
        if (this.dataLinhvuc) {
          const first = this.dataLinhvuc[0].id;
          this.loaidoituong = first;
          this.loadSukien(first);
          this.linhvucId = first;
          this.loadVr(first);
        }
      },

    })
    const viewMode = this.activatedRoute.snapshot.queryParamMap.has('view-mode') ? this.activatedRoute.snapshot.queryParamMap.get('view-mode') : 'desktop';
    if (viewMode === 'mobile') {

      this.unLesson = true;
    }
  }

  ngAfterViewInit() {
    this.updateNhanvatContent()
  }

  dataSukien: SuKien[];

  loadSukien(id: number) {
    this.notificationService.isProcessing(true)
    this.nguLieuSuKienService.getDataBylinhvucAndRoot(id).subscribe({
      next: data => {
        this.dataSukien = data.map(m => {
          m['_img_thumbnail'] = m.files ? this.fileService.getPreviewLinkLocalFile(m.files) : '';
          return m;
        })
        this.notificationService.isProcessing(false);
      }, error: () => {
        this.notificationService.isProcessing(false);
      }
    })
  }

  selectDataSukien(id: number) {
    this.loaidoituong = id;
    this.loadSukien(id);
  }

  linhvucId: number;

  selectDatavr(id: number) {
    this.linhvucId = id;
    this.loadVr(id);
  }

  dataVr: Ngulieu[];

  loadVr(id) {

    this.nguLieuDanhSachService.getDataByLinhvucAndRoot(id).subscribe({
      next: (data) => {
        this.dataVr = data.filter(f => f.loaingulieu === "video360" || f.loaingulieu === "image360").map(m => {
          m['_img_thumbnail'] = m.file_thumbnail ? this.fileService.getPreviewLinkLocalFile(m.file_thumbnail) : '';
          return m;
        });
      },
      error: () => {
      }
    })
  }

  btn_shift() {
    void this.router.navigate(['test/shift/']);
  }

  loaidoituong: number

  btnBackNhanvat() {
    this.nhanvatComponent.btnExit();
  }

  action_menu: boolean = false;

  btnActionMenu() {
    this.action_menu = !this.action_menu;
  }

  updateNhanvatContent() {
    if (this.isSmallScreen) {
      this.titleNhanvat = "DNLS";
    } else {
      this.titleNhanvat = "Nhân vật lịch sử";
    }
  }





  btnSelectNgulieu(item: Ngulieu) {
    const code = this.authService.encryptData(JSON.stringify({ngulieu_id: item.id}));
    void this.router.navigate(['virtual-tour'], {queryParams: {code}});
  }

  btnSelectSukien(item:SuKien){
    this.router.navigate(['/home/su-kien/'], {queryParams:{parram:item.id}});
  }
}
