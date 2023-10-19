import { Component, OnInit } from '@angular/core';
import {DanhMucChuyenMucService} from "@shared/services/danh-muc-chuyen-muc.service";
import {NguLieuDanhSachService} from "@shared/services/ngu-lieu-danh-sach.service";
import {NotificationService} from "@core/services/notification.service";
import {FileService} from "@core/services/file.service";
import {AuthService} from "@core/services/auth.service";
import {Router} from "@angular/router";
import {DmChuyenMuc} from "@shared/models/danh-muc";
import {Ngulieu} from "@shared/models/quan-ly-ngu-lieu";

@Component({
  selector: 'app-mobile-chuyen-muc',
  templateUrl: './mobile-chuyen-muc.component.html',
  styleUrls: ['./mobile-chuyen-muc.component.css']
})
export class MobileChuyenMucComponent  implements OnInit {

  constructor(
    private chuyenmuc: DanhMucChuyenMucService,
    private ngulieu: NguLieuDanhSachService,
    private notification: NotificationService,
    private fileService:FileService,
    private authService:AuthService,
    private router:Router

  ) {
  }

  ngOnInit(): void {
    this.loadDanhmuc()
  }

  dataChuyenmuc: DmChuyenMuc[];
  ngulieuImage360:Ngulieu[]= [];
  ngulieuVideo360:Ngulieu[]= [];
  loadDanhmuc() {
    this.chuyenmuc.getDataUnlimit().subscribe({
      next: data => {
        this.dataChuyenmuc = data;
        if (this.dataChuyenmuc){
          this.loadNgulieu();
        }
      }
    })
  }

  loadNgulieu(search?: number) {
    this.notification.isProcessing(true);
    this.ngulieu.getDataByChuyenmucID(search).subscribe({
      next: (data) => {
        const dataNguLieu = data.map(m=>{
          m['__file_thumbnail'] = m.file_thumbnail ? this.fileService.getPreviewLinkLocalFile(m.file_thumbnail): '';
          return m;
        })
        this.ngulieuImage360=dataNguLieu.filter(f=>f.loaingulieu === "image360")? dataNguLieu.filter(f=>f.loaingulieu === "image360"):[];
        this.ngulieuVideo360=dataNguLieu.filter(f=>f.loaingulieu === "video360")? dataNguLieu.filter(f=>f.loaingulieu === "video360"):[];
        console.log(this.ngulieuImage360);
        console.log(this.ngulieuVideo360);
        this.notification.isProcessing(false);

      }, error: () => {
        this.notification.isProcessing(false);

      }
    })
  }

  chuyenmucselect:number = 0;
  btnSelectChuyenmuc(item:DmChuyenMuc){
    this.chuyenmucselect= item.id;
    this.loadNgulieu(item.id);

  }
  btnSelectNgulieu(item:Ngulieu){
    const code = this.authService.encryptData(JSON.stringify({ngulieu_id :item.id}));
    void this.router.navigate(['virtual-tour'], {queryParams: {code, tag:'mobile'}});
  }


  btn_back_mobile(){}
  btn_backInfo(){}
  btn_nextInfo(){}
}
