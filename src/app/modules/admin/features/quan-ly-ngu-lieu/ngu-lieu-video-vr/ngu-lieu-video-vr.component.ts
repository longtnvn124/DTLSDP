import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {debounceTime, filter, forkJoin, Observable, Subject, Subscription} from "rxjs";
import {DmChuyenMuc, DmDiemDiTich, DmLinhVuc, DmLoaiNguLieu} from "@shared/models/danh-muc";
import {FileType} from "@shared/utils/syscat";
import {FormType, NgPaginateEvent, OvicForm} from "@shared/models/ovic-models";
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {Ngulieu} from "@shared/models/quan-ly-ngu-lieu";
import {Paginator} from "primeng/paginator";
import {ThemeSettingsService} from "@core/services/theme-settings.service";
import {NguLieuDanhSachService} from "@shared/services/ngu-lieu-danh-sach.service";
import {NotificationService} from "@core/services/notification.service";
import {DanhMucChuyenMucService} from "@shared/services/danh-muc-chuyen-muc.service";
import {DanhMucLoaiNguLieuService} from "@shared/services/danh-muc-loai-ngu-lieu.service";
import {DanhMucLinhVucService} from "@shared/services/danh-muc-linh-vuc.service";
import {DanhMucDiemDiTichService} from "@shared/services/danh-muc-diem-di-tich.service";
import {FileService} from "@core/services/file.service";
import {AuthService} from "@core/services/auth.service";
import {AvatarMakerSetting, MediaService} from "@shared/services/media.service";
import { getLinkDownload } from '@env';
import { HelperService } from '@core/services/helper.service';
interface FormNgulieu extends OvicForm {
  object: Ngulieu;
}

@Component({
  selector: 'app-ngu-lieu-video-vr',
  templateUrl: './ngu-lieu-video-vr.component.html',
  styleUrls: ['./ngu-lieu-video-vr.component.css']
})
export class NguLieuVideoVrComponent implements OnInit {
  @ViewChild('fromUpdate', {static: true}) template: TemplateRef<any>;
  @ViewChild('formMembers', {static: true}) formMembers: TemplateRef<any>;
  @ViewChild(Paginator, {static: true}) paginator: Paginator;
  private OBSERVE_SEARCH_DATA = new Subject<string>();
  formActive: FormNgulieu;
  private OBSERVE_PROCESS_FORM_DATA = new Subject<FormNgulieu>();
  subscription = new Subscription();
  listData: Ngulieu[];
  recordsTotal: number;
  loadInitFail = false;
  needUpdate = false;
  rows = this.themeSettingsService.settings.rows;
  isLoading: boolean = false;
  page = 1;
  menuName = 'Ngulieu';
  sizeFullWidth = 1024;
  filePermission = {
    canDelete: true,
    canDownload: true,
    canUpload: true
  };
  listForm = {
    [FormType.ADDITION]: {type: FormType.ADDITION, title: 'Thêm mới ngữ liệu video 360', object: null, data: null},
    [FormType.UPDATE]: {type: FormType.UPDATE, title: 'Cập nhật ngữ liệu video 360', object: null, data: null}
  };
  formSave: FormGroup = this.fb.group({
    title: ['', Validators.required],
    mota: [''],
    chuyenmuc: ['', Validators.required],
    loaingulieu: ['', Validators.required],
    linhvuc: ['', Validators.required],
    diemditich_ids:[[]],
    file_media: [[]],
    file_audio:[[]],
    donvi_id:[null, Validators.required],
    file_thumbnail:{},
    file_product:[[]],
    file_type:[0]
  });
  dataChuyemuc: DmChuyenMuc[];
  dataLoaingulieu: DmLoaiNguLieu[];
  dataLinhvuc: DmLinhVuc[];
  dataDiemDiTich:DmDiemDiTich[];
  constructor(
    private themeSettingsService: ThemeSettingsService,
    private nguLieuDanhSachService: NguLieuDanhSachService,
    private notificationService: NotificationService,
    private fb: FormBuilder,
    private danhMucChuyenMucService: DanhMucChuyenMucService,
    private danhMucLoaiNguLieuService: DanhMucLoaiNguLieuService,
    private danhMucLinhVucService: DanhMucLinhVucService,
    private danhMucDiemDiTichService: DanhMucDiemDiTichService,
    private fileService:FileService,
    private auth:AuthService,
    private mediaService:MediaService,
    private helperService:HelperService
  ) {
    const observeProcessFormData = this.OBSERVE_PROCESS_FORM_DATA.asObservable().pipe(debounceTime(100)).subscribe(form => this.__processFrom(form));
    this.subscription.add(observeProcessFormData);
    const observeProcessCloseForm = this.notificationService.onSideNavigationMenuClosed().pipe(filter(menuName => menuName === this.menuName && this.needUpdate)).subscribe(() => this.loadData(this.page));
    this.subscription.add(observeProcessCloseForm);
    const observerOnResize = this.notificationService.observeScreenSize.subscribe(size => this.sizeFullWidth = size.width)
    this.subscription.add(observerOnResize);
    const observerSearchData = this.OBSERVE_SEARCH_DATA.asObservable().pipe(debounceTime(300)).subscribe(() => {
      this.paginator.changePage(1);
      this.loadData(1);
    });
    this.subscription.add(observerSearchData);
  }


  ngOnInit(): void {
    this.loadInit();
  }

  loadInit() {
    forkJoin<[DmChuyenMuc[], DmLoaiNguLieu[], DmLinhVuc[],DmDiemDiTich[]]>(
      this.danhMucChuyenMucService.getDataUnlimit(),
      this.danhMucLoaiNguLieuService.getDataUnlimit(),
      this.danhMucLinhVucService.getDataUnlimit(),
      this.danhMucDiemDiTichService.getDataUnlimit()
    ).subscribe({
      next: ([dataChuyemuc, dataLoaingulieu, dataLinhvuc,dataDiemDitich]) => {
        this.dataChuyemuc = dataChuyemuc;
        this.dataLoaingulieu = dataLoaingulieu;
        this.dataLinhvuc = dataLinhvuc;
        this.dataDiemDiTich=dataDiemDitich;
        this.loadData(1);
      },
      error: () => {
        this.notificationService.isProcessing(false);
        this.notificationService.toastError('Mất kết nối với máy chủ');
      }
    })
  }

  loadData(page: number) {
    let i = 1;
    this.isLoading = true;
    this.nguLieuDanhSachService.getDataByLinhvucIdAndSearch(page, this.filterData.linhvucid, this.filterData.search, this.filterData.loaingulieu).subscribe({
      next: ({data, recordsTotal}) => {

        this.listData = data.map(m => {
          const linhvuc = this.dataLinhvuc && m.linhvuc ? this.dataLinhvuc.find(f => f.id === m.linhvuc) : null;
          const loaingulieu = this.dataLoaingulieu && m.loaingulieu ? this.dataLoaingulieu.find(f => f.kyhieu === m.loaingulieu) : null;

          m['indexTable'] = (page -1)*10 + i++;
          m['__ten_converted'] = `<b>${m.title}</b><br>`;
          m['linhvuc_converted'] = linhvuc ? linhvuc.ten : '';
          m['loaingulieu_converted'] = loaingulieu ? loaingulieu.ten : '';
          m['fileType'] = m.file_media && m.file_media[0] && FileType.has(m.file_media[0].type) && (FileType.get(m.file_media[0].type)==='img'|| FileType.get(m.file_media[0].type)==='mp4') ? 'mediaVr' : 'info';
          m['__media_link']=m.file_media&& m.file_media[0] ? this.fileService.getPreviewLinkLocalFile(m.file_media[0]) :null;
          return m;
        });
        this.recordsTotal = this.listData.length;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.toastError('Mất kết nối với máy chủ');
      }
    })
  }

  private __processFrom({data, object, type}: FormNgulieu) {
    console.log(data);
    const observer$: Observable<any> = type === FormType.ADDITION ? this.nguLieuDanhSachService.create(data) : this.nguLieuDanhSachService.update(object.id, data);
    observer$.subscribe({
      next: () => {
        this.needUpdate = true;
        this.notificationService.toastSuccess('Thao tác thành công', 'Thông báo');
      },
      error: () => this.notificationService.toastError('Thao tác thất bại', 'Thông báo')
    });

  }

  get f(): { [key: string]: AbstractControl<any> } {
    return this.formSave.controls;
  }
  paginate({page}: NgPaginateEvent) {
    this.page = page + 1;
    this.loadData(this.page);
  }

  btnAddNew() {
    this.formSave.reset({
      title: '',
      mota: '',
      chuyenmuc: '',
      loaingulieu:'video360',
      diemditich_ids: [],
      linhvuc: '',
      file_media: [],
      file_audio: [],
      donvi_id:this.auth.userDonViId,
      file_thumbnail:{},
      file_product:[],
      file_type:0
    });
    this.loaidoituong === 0;
    this.formActive = this.listForm[FormType.ADDITION];
    this.preSetupForm(this.menuName);
  }

  private preSetupForm(name: string) {
    this.notificationService.isProcessing(false);
    this.notificationService.openSideNavigationMenu({
      name,
      template: this.template,
      size: this.sizeFullWidth,
      offsetTop: '0px'
    });
  }

  btnEdit(object: Ngulieu) {
    this.formSave.reset({
      title: object.title,
      mota: object.mota,
      chuyenmuc: object.chuyenmuc,
      loaingulieu: object.loaingulieu,
      diemditich_ids: object.diemditich_ids,
      linhvuc: object.linhvuc,
      file_media: object.file_media,
      file_audio: object.file_audio,
      donvi_id:object.donvi_id,
      file_thumbnail:object.file_thumbnail,
      file_product:object.file_product,
      file_type:object.file_type
    });
    this.loaidoituong === object.file_type
    this.formActive = this.listForm[FormType.UPDATE];
    this.characterAvatar = object.file_thumbnail ? getLinkDownload(object.file_thumbnail.id) : '';
    this.formActive.object = object;
    this.preSetupForm(this.menuName);
  };

  async btnDelete(object: Ngulieu) {
    const confirm = await this.notificationService.confirmDelete();
    if (confirm) {
      this.nguLieuDanhSachService.delete(object.id).subscribe({
        next: () => {
          this.page = Math.max(1, this.page - (this.listData.length > 1 ? 0 : 1));
          this.notificationService.isProcessing(false);
          this.notificationService.toastSuccess('Thao tác thành công');
          this.listData.filter(f => f.id != object.id);
        }, error: () => {
          this.notificationService.isProcessing(false);
          this.notificationService.toastError('Thao tác không thành công');
        }
      })
    }
  };

  mode: 'TABLE' | 'MEDIAVR' | 'INFO' = "TABLE";

  saveForm() {
    console.log(this.formSave.value);
    if (this.formSave.valid) {
      this.formActive.data = this.formSave.value;
      this.OBSERVE_PROCESS_FORM_DATA.next(this.formActive);
    } else {
      this.formSave.markAllAsTouched();
      this.notificationService.toastError('Vui lòng điền đầy đủ thông tin');
    }
  }

  closeForm() {
    this.loadInit();
    this.mode = "TABLE";
    this.notificationService.closeSideNavigationMenu();
  }

  objectVR: Ngulieu;
  visible:boolean= false;
  ngulieuInfo:Ngulieu;


  btnInformation(object: Ngulieu) {
    if (object.loaingulieu=== "video360" || object.loaingulieu === "image360") {
      this.mode = "MEDIAVR";
      this.objectVR = object;
    }
    else if(object.loaingulieu === 'image' ||object.loaingulieu === 'video'){
      this.visible=true;
      this.ngulieuInfo =object;
    }else{
      // tai lieu || audio || ...
      // this.mode = "INFO";
      this.visible=true;
      this.ngulieuInfo =object;
    }
  };

  changeFilter(event) {
    const linhvucid = event.value;
    this.filterData.linhvucid = linhvucid;
    this.loadData(1);
  }

  changeInput(event: string) {
    setTimeout(()=>{
      this.loadData(1);
    },1000);
  }
  filterData: { linhvucid: number, search: string,loaingulieu:string } = {linhvucid: null, search: '',loaingulieu:'video360'};
  btnExit() {
    this.mode = "TABLE";
  }


  //  ========ảnh thumbnail=========
  loaidoituong:0|1 = 0;//0:bientap// 1 sp dongs goi

  changeObjectType(type:0|1){
    if (this.loaidoituong !== type) {
      this.loaidoituong = type;
    }
    if(type ===1){
      this.f['file_type'].setValue(1);
    }else{
      this.f['file_type'].setValue(0);
    }
  }

  //su ly ảnh nền
  characterAvatar:string = '';
  async makeCharacterAvatar(file: File, characterName: string): Promise<File> {
    try {
      const options: AvatarMakerSetting = {
        aspectRatio: 3 / 2,
        resizeToWidth: 1000,
        format: 'jpeg',
        cropperMinWidth: 10,
        dirRectImage: {
          enable: true,
          dataUrl: URL.createObjectURL(file)
        }
      };
      const avatar = await this.mediaService.callAvatarMaker(options);
      if (avatar && !avatar.error && avatar.data) {
        const none = new Date().valueOf();
        const fileName = characterName + none + '.jpg';
        return Promise.resolve(this.fileService.base64ToFile(avatar.data.base64, fileName));
      } else {
        return Promise.resolve(null);
      }
    } catch (e) {
      this.notificationService.isProcessing(false);
      this.notificationService.toastError('Quá trình tạo avatar thất bại');
      return Promise.resolve(null);
    }
  }

  async onInputAvatar(event, fileChooser: HTMLInputElement) {
    if (fileChooser.files && fileChooser.files.length) {
      const file = await this.makeCharacterAvatar(fileChooser.files[0], this.helperService.sanitizeVietnameseTitle(this.f['title'].value));
      // upload file to server
      this.fileService.uploadFile(file, 1).subscribe({
        next: fileUl => {
          this.formSave.get('file_thumbnail').setValue(fileUl);
        }, error: () => {
          this.notificationService.toastError('Upload file không thành công');
        }
      })
      // laasy thoong tin vaf update truongwf
      this.characterAvatar = URL.createObjectURL(file);
    }
  }

  btnCheck(ngulieu:Ngulieu){
    if(ngulieu.root ===1){
      this.nguLieuDanhSachService.update(ngulieu.id, {root:0}).subscribe({
        next:()=>{
          this.listData.find(f=>f.id === ngulieu.id).root =0;
          this.notificationService.isProcessing(false);
          this.notificationService.toastSuccess("Câp nhật thành công");
        },
        error:()=>{
          this.notificationService.isProcessing(false);
          this.notificationService.toastError("Cập nhật không thành công");
        }
      })
    }else if(ngulieu.root === 0){
      this.nguLieuDanhSachService.update(ngulieu.id, {root:1}).subscribe({
        next:()=>{
          this.listData.find(f=>f.id === ngulieu.id).root =1;
          this.notificationService.isProcessing(false);
          this.notificationService.toastSuccess("Câp nhật thành công");
        },
        error:()=>{
          this.notificationService.isProcessing(false);
          this.notificationService.toastError("Cập nhật không thành công");
        }
      })
    }
  }
}
