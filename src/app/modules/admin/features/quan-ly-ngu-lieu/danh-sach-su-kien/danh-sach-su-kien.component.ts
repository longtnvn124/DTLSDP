import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {FormType, NgPaginateEvent, OvicForm} from "@shared/models/ovic-models";
import { SuKien} from "@shared/models/quan-ly-ngu-lieu";
import {Paginator} from "primeng/paginator";
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {debounceTime, filter, forkJoin, Observable, Subject, Subscription} from "rxjs";
import {DanhMucChuyenMucService} from "@shared/services/danh-muc-chuyen-muc.service";
import {DanhMucDiemDiTichService} from "@shared/services/danh-muc-diem-di-tich.service";
import {DanhMucLinhVucService} from "@shared/services/danh-muc-linh-vuc.service";
import {DanhMucLoaiNguLieuService} from "@shared/services/danh-muc-loai-ngu-lieu.service";
import {ThemeSettingsService} from "@core/services/theme-settings.service";
import {NotificationService} from "@core/services/notification.service";
import {AuthService} from "@core/services/auth.service";
import {HelperService} from "@core/services/helper.service";
import {NguLieuDanhSachService} from "@shared/services/ngu-lieu-danh-sach.service";
import {DmDiemDiTich, DmLinhVuc, DmNhanVatLichSu} from "@shared/models/danh-muc";
import {OvicButton} from "@core/models/buttons";
import {NguLieuSuKienService} from "@shared/services/ngu-lieu-su-kien.service";
import {DanhMucNhanVatLichSuService} from "@shared/services/danh-muc-nhan-vat-lich-su.service";
import { EmployeesPickerService } from '@modules/shared/services/employees-picker.service';
import { FileService } from '@core/services/file.service';
import {Cache} from "three";
import files = Cache.files;
import {AvatarMakerSetting, MediaService} from "@shared/services/media.service";
import {getLinkDownload} from "@env";

interface FormSuKien extends OvicForm {
  object: SuKien;
}

@Component({
  selector: 'app-danh-sach-su-kien',
  templateUrl: './danh-sach-su-kien.component.html',
  styleUrls: ['./danh-sach-su-kien.component.css']
})
export class DanhSachSuKienComponent implements OnInit {
  @ViewChild('fromUpdate', {static: true}) template: TemplateRef<any>;
  @ViewChild('formInformation', {static: true}) formInformation: TemplateRef<any>;
  @ViewChild(Paginator) paginator: Paginator;

  listData: SuKien[];

  filePermission = {
    canDelete: true,
    canDownload: true,
    canUpload: true
  };
  headButtons = [
    {
      label: 'Thêm sự kiện',
      name: 'BUTTON_ADD_NEW',
      icon: 'pi-plus pi',
      class: 'p-button-rounded p-button-success ml-3 mr-2'
    },
  ];
  listForm = {
    [FormType.ADDITION]: {type: FormType.ADDITION, title: 'Thêm mới sự kiện ', object: null, data: null},
    [FormType.UPDATE]: {type: FormType.UPDATE, title: 'Cập nhật sự kiện ', object: null, data: null}
  };
  formActive: FormSuKien;
  formSave: FormGroup;

  private OBSERVE_PROCESS_FORM_DATA = new Subject<FormSuKien>();

  rows = this.themeSettingsService.settings.rows;
  loadInitFail = false;
  subscription = new Subscription();
  sizeFullWidth = 1024;
  isLoading = true;
  needUpdate = false;

  menuName: 'ds_sukien';
  page = 1;
  recordsTotal = 0;
  index = 1;

  search: string;
  characterAvatar: string;
  @ViewChild('fileChooser', {static: true}) fileChooser: TemplateRef<any>;
  constructor(
    private danhMucChuyenMucService: DanhMucChuyenMucService,
    private danhMucDiemDiTichService: DanhMucDiemDiTichService,
    private danhMucLinhVucService: DanhMucLinhVucService,
    private danhMucLoaiNguLieuService: DanhMucLoaiNguLieuService,
    private themeSettingsService: ThemeSettingsService,
    private notificationService: NotificationService,
    private fb: FormBuilder,
    private auth: AuthService,
    private helperService: HelperService,
    private nguLieuDanhSachService: NguLieuDanhSachService,
    private nguLieuSuKienService: NguLieuSuKienService,
    private danhMucNhanVatLichSuService: DanhMucNhanVatLichSuService,
    private employeesPickerService:EmployeesPickerService,
    private fileService:FileService,
    private mediaService:MediaService
  ) {
    this.formSave = this.fb.group({
      title: ['', Validators.required],
      mota: [''],
      diemditich_ids: [null,],
      thoigian_batdau: ['', Validators.required],
      thoigian_ketthuc: ['', Validators.required],
      files: [null],
      nhanvat_ids: [null],
      ngulieu_ids: [[]],
      donvi_id: [null, Validators.required],
      file_audio:[[]],
      linhvuc:[null,Validators.required]
    });

    const observeProcessFormData = this.OBSERVE_PROCESS_FORM_DATA.asObservable().pipe(debounceTime(100)).subscribe(form => this.__processFrom(form));
    this.subscription.add(observeProcessFormData);
    const observeProcessCloseForm = this.notificationService.onSideNavigationMenuClosed().pipe(filter(menuName => menuName === this.menuName && this.needUpdate)).subscribe(() => this.loadData(this.page));
    this.subscription.add(observeProcessCloseForm);
    const observerOnResize = this.notificationService.observeScreenSize.subscribe(size => this.sizeFullWidth = size.width)
    this.subscription.add(observerOnResize);
  }

  dataDiemditich: DmDiemDiTich[];
  dataNhanvatlichsu: DmNhanVatLichSu[];
  dataLinhvuc:DmLinhVuc[];

  ngOnInit(): void {
    this.notificationService.isProcessing(true);
    forkJoin<[DmDiemDiTich[], DmNhanVatLichSu[],DmLinhVuc[]]>(
      this.danhMucDiemDiTichService.getDataUnlimit(),
      this.danhMucNhanVatLichSuService.getDataUnlimit(),
      this.danhMucLinhVucService.getDataUnlimit()
    ).subscribe({
      next: ([dataDiemditich, dataNhanvatlichsu,linhvuc]) => {
        this.dataDiemditich = dataDiemditich;
        this.dataNhanvatlichsu = dataNhanvatlichsu;
        this.dataLinhvuc= linhvuc
        if(this.dataDiemditich && this.dataNhanvatlichsu && this.dataLinhvuc){
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

  loadInit() {
    this.isLoading = true;
    this.loadData(1);
  }

  isArray(input: any): boolean {
    return Array.isArray(input);
  }
  loadData(page) {
    // const limit = this.themeSettingsService.settings.rows;
    // this.index = (page * limit) - limit + 1;
    this.page = page;
    this.nguLieuSuKienService.searchData(page, this.search).subscribe({
      next: ({data, recordsTotal}) => {
        let index=1;
        this.listData = data.map(m => {
          let nhanvatId = m.nhanvat_ids;
          let nhanvat = [];
          nhanvatId.forEach(f => {
            if(this.dataNhanvatlichsu.find(m => m.id === f)){
              nhanvat.push(this.dataNhanvatlichsu.find(m => m.id === f));
            }
          });
          let ditich = [];
          m.diemditich_ids.forEach(f => {
            if(this.dataDiemditich.find(m => m.id === f)){
              ditich.push(this.dataDiemditich.find(m => m.id === f));
            }
          });
          m['__indexTable']= index++;
          m['__title_converted'] = `<b>${m.title}</b>`;
          m['__time_converted'] = m.thoigian_batdau + ' - ' + m.thoigian_ketthuc;
          m['__nhanvat_converted'] = nhanvat ? nhanvat :'';
          m['__diemditich_ids_coverted'] = ditich? ditich :'';
          m['__decode_mota'] = this.helperService.decodeHTML(m.mota);
          return m;
        })
        console.log(this.listData);
        this.recordsTotal = this.listData.length;
        this.isLoading = false;
        this.notificationService.isProcessing(false);
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.isProcessing(false);
        this.notificationService.toastError('Mất kết nối với máy chủ');
      }
    })
  }

  private __processFrom({data, object, type}: FormSuKien) {
    const observer$: Observable<any> = type === FormType.ADDITION ? this.nguLieuSuKienService.create(data) : this.nguLieuSuKienService.update(object.id, data);
    observer$.subscribe({
      next: () => {
        if (type === FormType.ADDITION) {
          this.formSave.reset({
            title: '',
            mota: '',
            diemditich_ids: null,
            thoigian_batdau: '',
            thoigian_ketthuc: '',
            files: [],
            nhanvat_id: null,
            donvi_id: null,
            file_audio:[],
            linhvuc:null
          });
          this.characterAvatar = '';
        }

        this.needUpdate = true;
        this.notificationService.toastSuccess('Thao tác thành công', 'Thông báo');
      },

      error: () => this.notificationService.toastError('Thao tác thất bại', 'Thông báo')
    });
  }

  paginate({page}: NgPaginateEvent) {
    this.page = page + 1;
    this.loadData(this.page);
  }

  get f(): { [key: string]: AbstractControl<any> } {
    return this.formSave.controls;
  }

  onSearch(text: string) {
    this.search = text;
    this.paginator.changePage(1);
    this.loadData(1);
  }
  btnNameSave:"Lưu lại"| "Cập nhật";

  private preSetupForm(name: string, size:number) {
    this.notificationService.isProcessing(false);
    this.notificationService.openSideNavigationMenu({
      name: name,
      template: this.template,
      size:size,
      offsetTop: '0px'
    });
  }

  closeForm() {
    this.loadInit();
    this.notificationService.closeSideNavigationMenu(this.menuName);
  }
  changeInput(event: string) {
    setTimeout(()=>{
      this.loadData(1);
    },1000);
  }
  async handleClickOnTable(button: OvicButton) {
    if (!button) {
      return;
    }
    const decision = button.data && this.listData ? this.listData.find(u => u.id === button.data) : null;
    switch (button.name) {
      case 'BUTTON_ADD_NEW':
        this.btnNameSave = "Lưu lại";
        this.formSave.reset({
          title: '',
          mota: '',
          diemditich_ids: null,
          thoigian_batdau: '',
          thoigian_ketthuc: '',
          files: null,
          nhanvat_ids: null,
          donvi_id: this.auth.userDonViId
        });
        this.formActive = this.listForm[FormType.ADDITION];
        this.preSetupForm(this.menuName,this.sizeFullWidth);
        break;
      case 'EDIT_DECISION':
        this.btnNameSave ="Cập nhật";
        const object1 = this.listData.find(u => u.id === decision.id);
        this.formSave.reset({
          title: object1.title,
          mota: object1.mota,
          diemditich_ids: object1.diemditich_ids,
          thoigian_batdau: object1.thoigian_batdau,
          thoigian_ketthuc: object1.thoigian_ketthuc,
          files: object1.files,
          nhanvat_ids: object1.nhanvat_ids,
          donvi_id: object1.donvi_id,
          ngulieu_ids: object1.ngulieu_ids,
        })

        this.formSave.enable();
        this.formActive = this.listForm[FormType.UPDATE];
        this.formActive.object = object1;
        this.preSetupForm(this.menuName,this.sizeFullWidth);
        break;
      case 'DELETE_DECISION':
        const confirm = await this.notificationService.confirmDelete();
        if (confirm) {
          this.nguLieuDanhSachService.delete(decision.id).subscribe({
            next: () => {
              this.page = Math.max(1, this.page - (this.listData.length > 1 ? 0 : 1));
              this.notificationService.isProcessing(false);
              this.notificationService.toastSuccess('Thao tác thành công');
              this.loadData(this.page);

            }, error: () => {
              this.notificationService.isProcessing(false);
              this.notificationService.toastError('Thao tác không thành công');
            }
          })
        }
        break;
      case 'INFO_DECISION':
        this.dataInfo = this.listData.find(f => f.id === decision.id);
        console.log(this.dataInfo);
        setTimeout(() => this.notificationService.openSideNavigationMenu({
          name: this.menuName,
          template: this.formInformation,
          size: this.sizeFullWidth,
          offsetTop: '0px',
          offCanvas: false
        }), 100);
        break;
      default:
        break;
    }
  }

  btnAdd(){
    this.formSave.reset({
      title: '',
      mota: '',
      diemditich_ids: null,
      thoigian_batdau: '',
      thoigian_ketthuc: '',
      files: [],
      nhanvat_ids: null,
      donvi_id: this.auth.userDonViId,
      file_audio:[],
      linhvuc:null
    });
    this.characterAvatar = '';
    this.formActive = this.listForm[FormType.ADDITION];
    this.preSetupForm(this.menuName,this.sizeFullWidth);
  }

  dataInfoFiles :any;
  btnInformation(id:number){
    this.dataInfo = this.listData.find(f => f.id === id);
    console.log(this.dataInfo);
    // const files =  this.dataInfo.files.filter(f>f.type.split('/')[0])

    setTimeout(() => this.notificationService.openSideNavigationMenu({
      name: this.menuName,
      template: this.formInformation,
      size: this.sizeFullWidth,
      offsetTop: '0px',
      offCanvas: false
    }), 100);
  }
  btnEdit(object1:SuKien){
    // const object1 = this.listData.find(u => u.id === decision.id);
    this.formSave.reset({
      title: object1.title,
      mota: object1.mota,
      diemditich_ids: object1.diemditich_ids,
      thoigian_batdau: object1.thoigian_batdau,
      thoigian_ketthuc: object1.thoigian_ketthuc,
      files: object1.files,
      nhanvat_ids: object1.nhanvat_ids,
      donvi_id: object1.donvi_id,
      ngulieu_ids: object1.ngulieu_ids,
      file_audio:object1.file_audio,
      linhvuc:object1.linhvuc
    })
    this.characterAvatar = object1.files ? getLinkDownload(object1.files.id):'';

    this.formSave.enable();
    this.formActive = this.listForm[FormType.UPDATE];
    this.formActive.object = object1;
    this.preSetupForm(this.menuName,this.sizeFullWidth);


  }
  async btnDelete(id:number){
    const confirm = await this.notificationService.confirmDelete();
    if (confirm) {
      this.nguLieuSuKienService.delete(id).subscribe({
        next: () => {
          this.page = Math.max(1, this.page - (this.listData.length > 1 ? 0 : 1));
          this.listData.filter(f=>f.id != id);
          this.notificationService.isProcessing(false);
          this.notificationService.toastSuccess('Thao tác thành công');
          this.loadData(this.page);
        }, error: () => {
          this.notificationService.isProcessing(false);
          this.notificationService.toastError('Thao tác không thành công');
        }
      })
    }
  }
  dataInfo: SuKien;

  saveForm() {
    if (this.formSave.valid) {
      console.log(this.formSave.value);
      this.formActive.data = this.formSave.value;
      this.OBSERVE_PROCESS_FORM_DATA.next(this.formActive);
    } else {
      this.formSave.markAllAsTouched();
      this.notificationService.toastError('Vui lòng điền đầy đủ thông tin');
    }
  }

  //su ly ảnh nền
  async makeCharacterAvatar(file: File, characterName: string): Promise<File> {
    try {
      const options: AvatarMakerSetting = {
        aspectRatio: 3 / 2,
        resizeToWidth: 400,
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
          this.formSave.get('files').setValue(fileUl);
        }, error: () => {
          this.notificationService.toastError('Upload file không thành công');
        }
      })
      // laasy thoong tin vaf update truongwf
      this.characterAvatar = URL.createObjectURL(file);
    }
  }

  btnCheck(sukien:SuKien){
    if(sukien.root === 1){
      this.nguLieuSuKienService.update(sukien.id, {root:0}).subscribe();
      this.listData.find(f=>f.id === sukien.id).root =0;
      // this.loadData(this.page);
      this.notificationService.toastSuccess('Thao tác thành công');

    }else if(sukien.root ===0){
      this.nguLieuSuKienService.update(sukien.id, {root:1}).subscribe();
      this.listData.find(f=>f.id === sukien.id).root =1;
      // this.loadData(this.page);
      this.notificationService.toastSuccess('Thao tác thành công');
    }
  }

}
