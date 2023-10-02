import {AfterViewInit, Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {paramChuyenDe} from "@shared/models/quan-ly-chuyen-de";
import {Ngulieu} from "@shared/models/quan-ly-ngu-lieu";
import {FileService} from "@core/services/file.service";
import {ChuyenDeService} from "@shared/services/chuyen-de.service";
import {NguLieuDanhSachService} from "@shared/services/ngu-lieu-danh-sach.service";
import {BUTTON_NO, BUTTON_YES} from "@core/models/buttons";
import {NotificationService} from "@core/services/notification.service";
import {Route, Router} from "@angular/router";

@Component({
  selector: 'ovic-media-vr-product',
  templateUrl: './ovic-media-vr-product.component.html',
  styleUrls: ['./ovic-media-vr-product.component.css']
})
export class OvicMediaVrProductComponent implements OnInit,AfterViewInit,OnChanges {
  @Input() isHome:boolean= false;
  @Input() _ngulieu: Ngulieu;
  link: string;

  constructor(
    private ngulieu:NguLieuDanhSachService,
    private notificationService:NotificationService,
    private router:Router
  ) { }

  ngOnInit(): void {

  }
  ngAfterViewInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log(this._ngulieu);
    this.loadProduct();
  }
  loadProduct(){
    const ngulieuId = this._ngulieu.id;
    if(this._ngulieu && this._ngulieu.file_product && this._ngulieu.file_product[0]){
      this.ngulieu.loadUrlNgulieuById(ngulieuId).subscribe({
        next:(url)=>{
          this.link = url['data'];
        }
      })
    }
    console.log(this.link);
  }


  async gobackhome(){
    const button = await this.notificationService.confirmRounded('Xác nhận','Trở lại trang chủ',[BUTTON_YES,BUTTON_NO]);
    if(button.name === BUTTON_YES.name){
      void this.router.navigate(['home/']);
    }

  }
}
