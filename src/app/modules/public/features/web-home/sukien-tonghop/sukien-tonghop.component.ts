import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import {NguLieuSuKienService} from "@shared/services/ngu-lieu-su-kien.service";
import {NotificationService} from "@core/services/notification.service";
import {SuKien} from "@shared/models/quan-ly-ngu-lieu";
import {FileService} from "@core/services/file.service";

@Component({
  selector: 'app-sukien-tonghop',
  templateUrl: './sukien-tonghop.component.html',
  styleUrls: ['./sukien-tonghop.component.css']
})
export class SukienTonghopComponent implements OnInit, AfterViewInit {
  @Input() selectItem: boolean = false;
  @Input() viewFull: boolean = false;

  constructor(
    private nguLieuSuKienService: NguLieuSuKienService,
    private notificationService: NotificationService,
    private fileService: FileService
  ) {
  }
  mode:"DATA" |'INFO' = "DATA";
  ngAfterViewInit(): void {
    this.loadInit();
  }

  ngOnInit(): void {
  }

  listData: SuKien[];

  loadInit() {
    this.notificationService.isProcessing(true);
    this.nguLieuSuKienService.getAllData().subscribe({
      next: (data) => {
        this.listData = data.map(m => {
          m['_bg_link'] = m.files ? this.fileService.getPreviewLinkLocalFile(m.files) : "";
          m['_audio_link'] = m.file_audio && m.file_audio[0] ? this.fileService.getPreviewLinkLocalFile(m.file_audio[0]) : "";
          return m;
        })
        console.log(this.listData);
        this.notificationService.isProcessing(false);
      },

      error: () => {
        this.notificationService.isProcessing(false);
      }
    })
  }
  sukienActive: SuKien;

  selectSukien(id: number) {
    if (this.selectItem) {
      this.notificationService.isProcessing(true);
      this.sukienActive = this.listData.find(f => f.id === id);
      this.mode ="INFO";
      this.notificationService.isProcessing(false);

    }
  }

  btn_backInfo() {
     if(this.mode == 'INFO'){
       this.mode ="DATA";
     }
  }

}
