import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import {DmNhanVatLichSu} from "@shared/models/danh-muc";
import {DanhMucNhanVatLichSuService} from "@shared/services/danh-muc-nhan-vat-lich-su.service";
import {NguLieuSuKienService} from "@shared/services/ngu-lieu-su-kien.service";
import {NotificationService} from "@core/services/notification.service";
import {forkJoin} from "rxjs";
import {SuKien} from "@shared/models/quan-ly-ngu-lieu";
import {FileService} from "@core/services/file.service";

@Component({
  selector: 'app-nhanvat',
  templateUrl: './nhanvat.component.html',
  styleUrls: ['./nhanvat.component.css']
})
export class NhanvatComponent implements OnInit, AfterViewInit {
  @Input() selectItem: boolean = false;

  gioitinh = [{value: 1, label: 'Nam'}, {value: 0, label: 'Nữ'}];
  mode:'DATA'|'INFO' ="DATA";
  constructor(
    private DanhMucNhanVatLichSuService: DanhMucNhanVatLichSuService,
    private sukienService: NguLieuSuKienService,
    private notificationService: NotificationService,
    private fileSerivce: FileService
  ) {
  }
  textSearch:string = '';
  ngAfterViewInit(): void {
    this.loadInit()
  }

  ngOnInit(): void {
    // this.loadInit()
  }

  listData: DmNhanVatLichSu[];

  loadInit(text?:string) {
    console.log(text);
    this.notificationService.isProcessing(true);
    forkJoin<[DmNhanVatLichSu[], SuKien[]]>(this.DanhMucNhanVatLichSuService.getDataUnlimit(text), this.sukienService.getAllData()).subscribe({
      next: ([data, dataSukien]) => {
        this.listData = data.map(m => {
          m['_img_link'] = m.files ? this.fileSerivce.getPreviewLinkLocalFile(m.files) : '';
          const participation_event = dataSukien.filter(f => f.nhanvat_ids.filter(a => a === m.id));
          m['_sukien_thamgia'] = participation_event;
          const sIndex = this.gioitinh.findIndex(i => i.value === m.gioitinh);
          m['__gioitinh_converted'] = sIndex !== -1 ? this.gioitinh[sIndex].label : '';
          m['image_convenrted'] =   m.files ? this.fileSerivce.getPreviewLinkLocalFile(m.files) : '';
          return m;
        })
        console.log(this.listData);
        this.notificationService.isProcessing(false);
      }, error: () => {
        this.notificationService.isProcessing(false);
      }
    })
  }

  dataSelect: DmNhanVatLichSu;

  btnSelectItem(Dm: DmNhanVatLichSu) {
    if(this.selectItem){
      this.dataSelect = Dm;
      this.mode="INFO";
    }
  }
  btnExit(){
    if(this.mode == "INFO"){
      this.mode = "DATA";
    }
  }
  btnLoadByTextseach(text:string){
    this.loadInit(text);
  }

}
