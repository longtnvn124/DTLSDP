import {Component, OnInit} from '@angular/core';
import {DanhMucNhanVatLichSuService} from "@shared/services/danh-muc-nhan-vat-lich-su.service";
import {DmNhanVatLichSu} from "@shared/models/danh-muc";
import {FileService} from "@core/services/file.service";
import {Ngulieu} from "@shared/models/quan-ly-ngu-lieu";
import {NguLieuDanhSachService} from "@shared/services/ngu-lieu-danh-sach.service";
import {NotificationService} from "@core/services/notification.service";
import {ChuyenDeService} from "@shared/services/chuyen-de.service";
import {ChuyenDe} from "@shared/models/quan-ly-chuyen-de";
import {Router} from "@angular/router";
import {AuthService} from "@core/services/auth.service";

@Component({
  selector: 'app-mobile-home',
  templateUrl: './mobile-home.component.html',
  styleUrls: ['./mobile-home.component.css']
})
export class MobileHomeComponent implements OnInit {

  slides :{index:number, path:string, url:string}[] = [
    {index: 1, path: '/assets/slide/slide1.jpg', url:''},
    {index: 2, path: '/assets/slide/slide2.jpg', url:''},
    {index: 3, path: '/assets/slide/slide3.jpg', url:''},
    {index: 4, path: '/assets/slide/slide4.jpg', url:''},
  ];

  slideparam= [
    {
      "index": "1",
      "path": "https://ictu.vn/mobile/image/banner1.jpg",
      "url": ""
    },
    {
      "index": "2",
      "path": "https://ictu.vn/mobile/image/banner2.jpg",
      "url": ""
    }
  ];

  constructor(
    private nhanvat:DanhMucNhanVatLichSuService,
    private fileService:FileService,
    private nguLieuDanhSachService: NguLieuDanhSachService,
    private notificationService:NotificationService,
    private chuyende:ChuyenDeService,
    private router:Router,
    private authService:AuthService
  ) {

  }

  ngOnInit(): void {
    this.slideparam.map(f=>{
      const slides = [].concat({
        index: Number(f.index),
        path:f.path,
        url :f.url,
      });
      return slides;
    });
    this.loadNhanvat();
    this.loadVr360();
    this.LoadChuyenDe();
  }

  nhanvatLichSu:DmNhanVatLichSu[];
  loadNhanvat(){
    this.nhanvat.getDataUnlimit('').subscribe({
      next:(data)=>{
          this.nhanvatLichSu = data.map(f=>{
            f['_file_url'] = f.files ? this.fileService.getPreviewLinkLocalFileNotToken(f.files): '';
            return f;
          })
      },error:()=>{
      }
    })
  }

  ngulieuvr:Ngulieu[];
  loadVr360(){
    this.nguLieuDanhSachService.getDataByLinhvucAndRoot().subscribe({
      next: (data) => {
        this.ngulieuvr = data.filter(f => f.loaingulieu === "video360" || f.loaingulieu === "image360").map(m => {
          m['_img_thumbnail'] = m.file_thumbnail ? this.fileService.getPreviewLinkLocalFile(m.file_thumbnail) : '';
          return m;
        });
      },
      error: () => {
      }
    })
  }

  dataChuyenDe:ChuyenDe[];
  dataChuyenDeChild:ChuyenDe[];
  LoadChuyenDe(){
    this.notificationService.isProcessing(true)
    this.chuyende.loadDataUnlimitAndActive().subscribe({
      next:(data)=>{
        const newdata = data.map(m=>{
          m['_child']= data.filter(f=>f.parent_id ===m.id);
          return m;

        });
        this.dataChuyenDe = newdata.filter(f=>f.parent_id ===0);
        this.dataChuyenDeChild = this.dataChuyenDe[0]['_child'].length>3 ? this.dataChuyenDe[0]['_child'].slice(0,3) : this.dataChuyenDe[0]['_child'];
        this.notificationService.isProcessing(false)

      },error:()=>{
      this.notificationService.isProcessing(false)

    }
    })
  }
  showfullNhanvat(){
    this.router.navigate(['mobile/mobile-nhan-vat']);
  }
  showfullvr(){
    this.router.navigate(['mobile/mobile-vr-360']);
  }
  showfull31chuyende(){
    this.router.navigate(['mobile/mobile-chuyen-de']);
  }

  btnSelectNhanvat(item:DmNhanVatLichSu){
    this.router.navigate(['/mobile/mobile-nhan-vat/'], {queryParams:{param:item.id}});
  }
  btnSelectNgulieu(item: Ngulieu) {
    const code = this.authService.encryptData(JSON.stringify({ngulieu_id: item.id}));
    void this.router.navigate(['virtual-tour'], {queryParams: {code,tag:'mobile'}},);
  }
  btnSelectChuyende(item:ChuyenDe){
    this.router.navigate(['/mobile/mobile-chuyen-de/'], {queryParams:{param:item.id}});
  }

  // congthongtin:[]=[
  //   {id:1,url:'https://thainguyen.gov.vn'},
  //   {id:2,url:'https://thainguyen.dcs.vn'},
  // ]

  // btnPramCongthongtin(id:number){
  //   this.router.navigate(['/mobile/cong-thong-tin/'], {queryParams:{param:id}});
  // }


}