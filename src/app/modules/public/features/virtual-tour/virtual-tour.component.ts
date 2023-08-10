import {Component, OnInit} from '@angular/core';
import {PointsService} from "@shared/services/points.service";
import {AuthService} from "@core/services/auth.service";
import {NotificationService} from "@core/services/notification.service";
import {FileService} from "@core/services/file.service";
import {Point} from '@modules/shared/models/point';
import {MediaService} from "@shared/services/media.service";

@Component({
  selector: 'app-virtual-tour',
  templateUrl: './virtual-tour.component.html',
  styleUrls: ['./virtual-tour.component.css']
})
export class VirtualTourComponent implements OnInit {
  pointStart: Point;
  mode: "BTNPLAY" | "MEDIAVR" = "BTNPLAY";
  linkImg:string;
  constructor(
    private pointService: PointsService,
    private auth: AuthService,
    private notificationService: NotificationService,
    private fileService: FileService,
    private mediaService: MediaService
  ) {
  }

  ngOnInit(): void {
    this.loadScend();
  }

  loadScend() {
    this.notificationService.isProcessing(true);
    this.pointService.load().subscribe({
      next: (data) => {
        this.pointStart = data.find(f => f.root === 1);
        this.pointStart['__child'] = data.filter(f => f.parent_id === this.pointStart.id);
        this.linkImg = this.pointStart.ds_ngulieu.find(f=>f.loaingulieu ==='image360') ?
          this.fileService.getPreviewLinkLocalFile(this.pointStart.ds_ngulieu.find(f=>f.loaingulieu ==='image360')) : null;
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
}
