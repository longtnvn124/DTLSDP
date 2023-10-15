import {AfterViewInit, Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {NguLieuSuKienService} from "@shared/services/ngu-lieu-su-kien.service";
import {NotificationService} from "@core/services/notification.service";
import {FileService} from "@core/services/file.service";
import {DmNhanVatLichSu} from "@shared/models/danh-muc";
import {forkJoin} from "rxjs";
import {SuKien} from "@shared/models/quan-ly-ngu-lieu";
import {DanhMucNhanVatLichSuService} from "@shared/services/danh-muc-nhan-vat-lich-su.service";

@Component({
  selector: 'app-content-nhan-vat',
  templateUrl: './content-nhan-vat.component.html',
  styleUrls: ['./content-nhan-vat.component.css']
})
export class ContentNhanVatComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() selectItem: boolean = true;
  @Input() search: string;
  gioitinh = [{value: 1, label: 'Nam'}, {value: 0, label: 'Nữ'}];
  mode: 'DATA' | 'INFO' = "DATA";

  constructor(
    private danhMucNhanVatLichSuService:DanhMucNhanVatLichSuService,
    private sukienService: NguLieuSuKienService,
    private notificationService: NotificationService,
    private fileSerivce: FileService
  ) {
  }

  textSearch: string = '';

  ngAfterViewInit(): void {
    this.loadInit()
  }

  ngOnInit(): void {
    // this.loadInit()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.search) {
      this.loadInit(this.search);
    } else {
      this.loadInit();

    }
  }

  listData: DmNhanVatLichSu[] = [];

  loadInit(text?: string) {
    // this.notificationService.isProcessing(true);
    forkJoin<[DmNhanVatLichSu[], SuKien[]]>(this.danhMucNhanVatLichSuService.getDataUnlimit(text), this.sukienService.getAllData()).subscribe({
      next: ([data, dataSukien]) => {
        this.listData = data.map(m => {
          m['_img_link'] = m.files ? this.fileSerivce.getPreviewLinkLocalFile(m.files) : '';
          const participation_event = dataSukien.filter(f => f.nhanvat_ids.filter(a => a === m.id));
          m['_sukien_thamgia'] = participation_event;
          const sIndex = this.gioitinh.findIndex(i => i.value === m.gioitinh);
          m['__gioitinh_converted'] = sIndex !== -1 ? this.gioitinh[sIndex].label : '';
          m['image_convenrted'] = m.files ? this.fileSerivce.getPreviewLinkLocalFile(m.files) : '';
          return m;
        })
        // this.notificationService.isProcessing(false);
      }, error: () => {
        // this.notificationService.isProcessing(false);
      }
    })
  }

  dataSelect: DmNhanVatLichSu;

  btnSelectItem(Dm: DmNhanVatLichSu) {
    if (this.selectItem) {
      this.dataSelect = Dm;
      this.mode = "INFO";
    }
  }

  btnExit() {
    if (this.mode == "INFO") {
      this.mode = "DATA";
    }
  }

  btnLoadByTextseach(text: string) {
    this.loadInit(text);
  }

  btn_backInfo() {
    if (this.mode == 'INFO') {
      this.mode = "DATA";
    }
  }
  btn_nextInfo(){
    if (this.mode == 'DATA') {
      this.mode = "INFO";
    }
  }
}
