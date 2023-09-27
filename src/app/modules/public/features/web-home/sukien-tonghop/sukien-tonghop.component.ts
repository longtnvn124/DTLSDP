import {AfterViewInit, Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {NguLieuSuKienService} from "@shared/services/ngu-lieu-su-kien.service";
import {NotificationService} from "@core/services/notification.service";
import {SuKien} from "@shared/models/quan-ly-ngu-lieu";
import {FileService} from "@core/services/file.service";
import {forkJoin} from "rxjs";
import {DmDiemDiTich, DmNhanVatLichSu} from "@shared/models/danh-muc";
import { DanhMucDiemDiTichService } from '@modules/shared/services/danh-muc-diem-di-tich.service';
import { DanhMucNhanVatLichSuService } from '@modules/shared/services/danh-muc-nhan-vat-lich-su.service';

@Component({
  selector: 'app-sukien-tonghop',
  templateUrl: './sukien-tonghop.component.html',
  styleUrls: ['./sukien-tonghop.component.css']
})
export class SukienTonghopComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() selectItem: boolean = false;
  @Input() viewFull: boolean = false;
  @Input() search: string;

  dataDiemditich:DmDiemDiTich[];
  dataNhanvatlichsu:DmNhanVatLichSu[];

  private audio: HTMLAudioElement = document.createElement('audio');

  constructor(
    private nguLieuSuKienService: NguLieuSuKienService,
    private notificationService: NotificationService,
    private fileService: FileService,
    private danhMucDiemDiTichService:DanhMucDiemDiTichService,
    private danhMucNhanVatLichSuService:DanhMucNhanVatLichSuService
  ) {
  }
  mode:"DATA" |'INFO' = "DATA";
  ngAfterViewInit(): void {
    forkJoin<[DmDiemDiTich[], DmNhanVatLichSu[],]>(
      this.danhMucDiemDiTichService.getDataUnlimit(),
      this.danhMucNhanVatLichSuService.getDataUnlimit(null),

    ).subscribe({
      next: ([dataDiemditich, dataNhanvatlichsu,]) => {
        this.dataDiemditich = dataDiemditich;
        this.dataNhanvatlichsu = dataNhanvatlichsu;
        if(this.dataDiemditich && this.dataNhanvatlichsu){
          this.loadInit();
        }
        this.notificationService.isProcessing(false);

      },
      error: () => {
        this.notificationService.isProcessing(false);
        this.notificationService.toastError('Mất kết nối với máy chủ');
      }
    })


  }

  ngOnInit(): void {
  }
  ngOnChanges(changes: SimpleChanges): void {
    if(this.search){

      this.loadInit(this.search);
    }
  }
  listData: SuKien[]= [];

  loadInit(search?:string) {
    this.notificationService.isProcessing(true);
    this.nguLieuSuKienService.getAllData(search).subscribe({
      next: (data) => {
        this.listData = data.map(m => {
          m['_bg_link'] = m.files ? this.fileService.getPreviewLinkLocalFile(m.files) : "";
          m['_audio_link'] = m.file_audio && m.file_audio[0] ? this.fileService.getPreviewLinkLocalFile(m.file_audio[0]) : "";
          m['_nhanvat_convented']= m.nhanvat_ids? m.nhanvat_ids.map(f=>this.dataNhanvatlichsu.find(c=>c.id === f).bietdanh) :[];
          m['_diemditich_convented']= m.diemditich_ids? m.nhanvat_ids.map(f=>{

            const ten= this.dataDiemditich.find(c=>c.id === f)?this.dataDiemditich.find(c=>c.id === f).ten: '';
            return ten;
          }) :[];
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
      this.audio.setAttribute('src',this.sukienActive['_audio_link']);

      this.notificationService.isProcessing(false);

    }
  }

  btn_backInfo() {
     if(this.mode == 'INFO'){
       this.mode ="DATA";
     }
  }
  btnLoadByTextseach(text:string){
    this.loadInit(text);
  }
  playAudio(value:1|0){
    if(value ===1){
      this.audio.play();
    }else{
      this.audio.pause();

    }
  }
}
