import {Component, Input, OnInit} from '@angular/core';
import {PointsService} from "@shared/services/points.service";
import {AuthService} from "@core/services/auth.service";
import {NotificationService} from "@core/services/notification.service";
import {FileService} from "@core/services/file.service";
import {Point} from '@modules/shared/models/point';
import {MediaService} from "@shared/services/media.service";
import {MenuItem} from "primeng/api/menuitem";
import {Ngulieu} from "@shared/models/quan-ly-ngu-lieu";
import {Router} from "@angular/router";

@Component({
  selector: 'app-virtual-tour',
  templateUrl: './virtual-tour.component.html',
  styleUrls: ['./virtual-tour.component.css']
})
export class VirtualTourComponent implements OnInit {
  @Input() rotate:boolean = true;
  pointStart: Point;
  mode: "BTNPLAY" | "MEDIAVR" = "BTNPLAY";
  items:MenuItem[] = [
    { label:'Hình ảnh 3D', icon: 'pi pi-image',command:(event)=> this.viewSpace3D('image')},// view hình ảnh 3d
    { label:'Video 3D', icon: 'pi pi-video\n',command:()=> this.viewSpace3D('video')},// view video3d
  ];

  activeItem: MenuItem;


  linkImg:string;
  constructor(
    private pointService: PointsService,
    private auth: AuthService,
    private notificationService: NotificationService,
    private fileService: FileService,
    private mediaService: MediaService,
    private router: Router
  ) {
    this.activeItem = this.items[0];
  }

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.loadScend();
    } else {
      void this.router.navigate(['/login'], {queryParams: {redirect: 'test/shift'}});
    }

  }

  loadScend() {
    this.notificationService.isProcessing(true);
    this.pointService.load().subscribe({
      next: (data) => {
        this.pointStart = data.find(f => f.root === 1);
        this.pointStart['__child'] = data.filter(f => f.parent_id === this.pointStart.id);
        this.linkImg = this.pointStart.ds_ngulieu.find(f=>f.loaingulieu ==='image360') ?
          this.fileService.getPreviewLinkLocalFile(this.pointStart.ds_ngulieu.find(f=>f.loaingulieu ==='image360').file_media[0]) : null;
        this.notificationService.isProcessing(false);
      }, error: () => {
        this.notificationService.isProcessing(false);
        this.notificationService.toastError('Mất kết với máy chủ');
      }
    })
  }


  btnRun() {
    this.mode = "MEDIAVR";
    this.loadScend();
  }
  //tabmenu



  // danh sách button;
  dataPointChild:Point[];

  viewPoint:boolean= false

  viewSpace3D(type:'image'|'video'){
    this.notificationService.isProcessing(true);
    if(type === 'image'){
      this.activeItem === this.items[0];
      const parent = this.pointStart['__child'].filter(f=>f.type==='DIRECT').map(m=>{
        const dsNgulieu = m.ds_ngulieu;
        const ngulieuVr = dsNgulieu ? dsNgulieu.find(f=>f.loaingulieu ==='image360') : null;
        m['_url_link_view'] = ngulieuVr ? this.fileService.getPreviewLinkLocalFile(ngulieuVr.file_media[0]) : null;
        m['_typeVr']= ngulieuVr ? ngulieuVr.loaingulieu : null;
        return m;
      });
      this.dataPointChild = parent.filter(f=>f['_url_link_view']);
      this.notificationService.isProcessing(false);
    }else{
      this.activeItem === this.items[1];
      const parent = this.pointStart['__child'].filter(f=>f.type==='DIRECT').map(m=>{
        const dsNgulieu = m.ds_ngulieu;
        const ngulieuVr = dsNgulieu ? dsNgulieu.find(f=>f.loaingulieu ==='video360') : null;
        m['_url_link_view'] = ngulieuVr ? this.fileService.getPreviewLinkLocalFile(ngulieuVr.file_media[0]) : null;
        m['_typeVr']= ngulieuVr ? ngulieuVr.loaingulieu : null;
        return m;
      });
      this.dataPointChild = parent.filter(f=>f['_url_link_view']);
      this.notificationService.isProcessing(false);
    }

  }

  ngulieuPointStart:Ngulieu[];
  visibleDocomment:boolean= false;


}
// export type LoaiNguLieu = 'image' | 'video' | 'audio' | 'video360' | 'image360' | 'text' | 'others'
