import {AfterViewInit, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {DmDiemDiTich, DmNhanVatLichSu} from "@shared/models/danh-muc";
import {NguLieuSuKienService} from "@shared/services/ngu-lieu-su-kien.service";
import {NotificationService} from "@core/services/notification.service";
import {FileService} from "@core/services/file.service";
import {DanhMucDiemDiTichService} from "@shared/services/danh-muc-diem-di-tich.service";
import {DanhMucNhanVatLichSuService} from "@shared/services/danh-muc-nhan-vat-lich-su.service";
import {forkJoin} from "rxjs";
import {SuKien} from "@shared/models/quan-ly-ngu-lieu";
import {ActivatedRoute, ParamMap, Params} from "@angular/router";

@Component({
  selector: 'app-content-su-kien',
  templateUrl: './content-su-kien.component.html',
  styleUrls: ['./content-su-kien.component.css']
})
export class ContentSuKienComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  // @ViewChild('stream', {static: true}) stream: HTMLAudioElement;
  @Input() selectItem: boolean = true;

  @Input() search: string;

  dataDiemditich: DmDiemDiTich[];
  dataNhanvatlichsu: DmNhanVatLichSu[];

  audio_link: string;

  stream: HTMLAudioElement;

  constructor(
    private nguLieuSuKienService: NguLieuSuKienService,
    private notificationService: NotificationService,
    private fileService: FileService,
    private danhMucDiemDiTichService: DanhMucDiemDiTichService,
    private danhMucNhanVatLichSuService: DanhMucNhanVatLichSuService,
    private activatedRoute: ActivatedRoute
  ) {
    this.stream = document.createElement('audio');
    this.stream.setAttribute('playsinline', 'true');
    // this.sourceAudio = document.createElement('source');
    // this.sourceAudio.type = 'audio/mp3';
  }

  mode: "DATA" | 'INFO' = "DATA";
  id_param: number;

  ngAfterViewInit(): void {

  }

  ngOnDestroy(): void {
    this.stream.pause();
    this.stream.remove();
  }

  ngOnInit(): void {
    forkJoin<[DmDiemDiTich[], DmNhanVatLichSu[],]>(
      this.danhMucDiemDiTichService.getDataUnlimit(),
      this.danhMucNhanVatLichSuService.getDataUnlimit(null),
    ).subscribe({
      next: ([dataDiemditich, dataNhanvatlichsu,]) => {
        this.dataDiemditich = dataDiemditich;
        this.dataNhanvatlichsu = dataNhanvatlichsu;
        if (this.dataDiemditich && this.dataNhanvatlichsu) {
          this.loadfirst();
        }
        this.notificationService.isProcessing(false);

      },
      error: () => {
        this.notificationService.isProcessing(false);
        this.notificationService.toastError('Mất kết nối với máy chủ');
      }
    })


  }


  loadfirst() {
    const params: ParamMap = this.activatedRoute.snapshot.queryParamMap;
    const id: number = params.has('id') ? Number(params.get('id')) : NaN;
    if (!Number.isNaN(id)) {
      this.id_param = id;
      this.loadInit('');
      console.log(this.id_param);
    }else{
      this.loadInit('');
    }
  }

  ngOnChanges(changes: SimpleChanges): void {

  }

  listData: SuKien[] = [];

  loadInit(search?: string) {
    this.notificationService.isProcessing(true);
    this.nguLieuSuKienService.getAllData(search).subscribe({
      next: (data) => {
        this.listData = data.map(m => {
          m['_bg_link'] = m.files ? this.fileService.getPreviewLinkLocalFile(m.files) : "";
          m['_audio_link'] = m.file_audio && m.file_audio[0] ? this.fileService.getPreviewLinkLocalFileNotToken(m.file_audio[0]) : "";
          m['_nhanvat_convented'] = m.nhanvat_ids && this.dataNhanvatlichsu ? m.nhanvat_ids.map(f => this.dataNhanvatlichsu.find(c => c.id === f) ? this.dataNhanvatlichsu.find(c => c.id === f).bietdanh : '') : [];
          m['_diemditich_convented'] = m.diemditich_ids ? m.nhanvat_ids.map(f => {
            const ten = this.dataDiemditich.find(c => c.id === f) ? this.dataDiemditich.find(c => c.id === f).ten : '';
            return ten;
          }) : [];
          return m;
        })
        if (this.id_param && this.listData) {
          this.selectSukien(this.id_param);
        }
        this.notificationService.isProcessing(false);
      },

      error: () => {
        this.notificationService.isProcessing(false);
      }
    })
  }

  sukienActive: SuKien;


  selectSukien(id: number) {

    console.log(this.mode);
    this.notificationService.isProcessing(true);
    if (this.listData.find(f => f.id === id)) {

      this.sukienActive = this.listData.find(f => f.id === id);
      this.mode = "INFO";
    }

    this.notificationService.isProcessing(false);
    // this.sourceAudio.src = this.sukienActive['_audio_link'];
    // this.stream.appendChild(this.sourceAudio);
    // this.stream.setAttribute('autoplay', 'true');

    this.fileService.getFileAsObjectUrl(this.sukienActive.file_audio[0].id.toString(10)).subscribe({
      next: url => {
        const audio = new Audio();
        const source = document.createElement('source')
        source.setAttribute('src', url);
        source.setAttribute('type', this.sukienActive.file_audio[0].type);
        audio.appendChild(source);
        void audio.play();
        if (this.stream) {
          this.stream.remove();
        }
        this.stream = audio;
      }
    });
  }

  btn_backInfo() {
    if (this.mode == 'INFO') {
      this.stream.pause();
      this.stream.remove();
      this.mode = "DATA";
    }
  }

  btn_nextInfo(){
    if (this.mode == 'DATA') {
      this.mode = "INFO";
    }
  }

  btnLoadByTextseach(text: string) {
    this.loadInit(text);
  }


  playAudio(num: 1 | 0) {
    if (num === 1) {
      this.stream.play();
    }
    if (num === 0) {
      this.stream.pause();
    }
  }


}