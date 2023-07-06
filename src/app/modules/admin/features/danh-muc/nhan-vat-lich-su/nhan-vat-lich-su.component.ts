import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {OvicForm} from "@shared/models/ovic-models";
import {DmNhanVatLichSu} from "@shared/models/danh-muc";
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {filter, Subscription} from "rxjs";
import {ThemeSettingsService} from "@core/services/theme-settings.service";
import {NotificationService} from "@core/services/notification.service";
import {DanhMucNhanVatLichSuService} from "@shared/services/danh-muc-nhan-vat-lich-su.service";

import {FileService} from "@core/services/file.service";
import {AvatarMakerSetting, MediaService} from "@shared/services/media.service";
import {getLinkDownload} from "@env";
import {HelperService} from "@core/services/helper.service";
import {AuthService} from "@core/services/auth.service";

interface FormDmNhanVatLichSu extends OvicForm {
  object: DmNhanVatLichSu;
}

@Component({
  selector: 'app-nhan-vat-lich-su',
  templateUrl: './nhan-vat-lich-su.component.html',
  styleUrls: ['./nhan-vat-lich-su.component.css']
})
export class NhanVatLichSuComponent implements OnInit {
  @ViewChild('fromUpdate', {static: true}) fromUpdate: TemplateRef<any>;
  @ViewChild('formInfo', {static: true}) formInfo: TemplateRef<any>;
  gioitinh = [{value: 1, label: 'Nam'}, {value: 0, label: 'Nữ'}];
  formActive: FormDmNhanVatLichSu;
  formSave: FormGroup;
  page = 1;
  subscription = new Subscription();
  sizeFullWidth = 1024;
  isLoading = true;
  needUpdate = false;
  menuName: 'dm_nhanvatlichsu';
  filter = {
    search: ''
  }
  listData: DmNhanVatLichSu[];

  formState: {
    formType: 'add' | 'edit',
    showForm: boolean,
    formTitle: string,
    object: DmNhanVatLichSu | null
  } = {
    formType: 'add',
    showForm: false,
    formTitle: '',
    object: null
  }

  filePermission = {
    canDelete: true,
    canDownload: true,
    canUpload: true
  };

  characterAvatar: string;

  // filePermistionOnlyShow = { canDelete : false , canDownload : true , canUpload : false };

  @ViewChild('fileChooser', {static: true}) fileChooser: TemplateRef<any>;

  constructor(
    private themeSettingsService: ThemeSettingsService,
    private notificationService: NotificationService,
    private fb: FormBuilder,
    private fileService: FileService,
    private danhMucNhanVatLichSuService: DanhMucNhanVatLichSuService,
    private mediaService: MediaService,
    private helperService: HelperService,
    private auth: AuthService,
  ) {
    this.formSave = this.fb.group({
      ten: ['', Validators.required],
      bietdanh: ['', Validators.required],
      mota: [''],
      nam: ['', Validators.required],
      gioitinh: [null, Validators.required],
      files: [],
      giaidoan_lichsu: [''],
    });
    const observeProcessCloseForm = this.notificationService.onSideNavigationMenuClosed().pipe(filter(menuName => menuName === this.menuName && this.needUpdate)).subscribe(() => this.loadData(this.page));
    this.subscription.add(observeProcessCloseForm);
    const observerOnResize = this.notificationService.observeScreenSize.subscribe(size => this.sizeFullWidth = size.width)
    this.subscription.add(observerOnResize);
  }

  ngOnInit(): void {
    this.loadInit()
  }

  loadInit() {
    this.loadData(1);
  }

  loadData(page) {
    this.notificationService.isProcessing(true);
    this.danhMucNhanVatLichSuService.search(page, null, this.filter.search).subscribe({
      next: (data) => {
        this.listData = data.map(m => {
          const sIndex = this.gioitinh.findIndex(i => i.value === m.gioitinh);
          m['__gioitinh_converted'] = sIndex !== -1 ? this.gioitinh[sIndex].label : '';
          return m;
        })
        this.notificationService.isProcessing(false);
        console.log(this.listData);
      }, error: () => {
        this.notificationService.isProcessing(false);
        this.notificationService.toastError('Mất kết nối với máy chủ');
      }
    })
  }

  get f(): { [key: string]: AbstractControl<any> } {
    return this.formSave.controls;
  }

  onSearch(text: string) {
    this.filter.search = text;
    this.loadData(1);
  }

  async btnDelete(id) {
    const xacNhanXoa = await this.notificationService.confirmDelete();
    if (xacNhanXoa) {
      this.notificationService.isProcessing(true);
      this.danhMucNhanVatLichSuService.delete(id).subscribe({
        next: () => {
          this.loadData(1);
          this.notificationService.isProcessing(false);
          this.notificationService.toastSuccess('Thao tác thành công');
        }, error: () => {
          this.notificationService.isProcessing(false);
          this.notificationService.toastError('Thao tác thất bại');
        }
      })
    }
  }

  onOpenFormEdit() {
    setTimeout(() => this.notificationService.openSideNavigationMenu({template: this.fromUpdate, size: 600}), 100);
  }


  changeInputMode(formType: 'add' | 'edit', object: DmNhanVatLichSu | null = null) {
    this.formState.formTitle = formType === 'add' ? 'Thêm nhân vật lịch sử' : 'Cập nhật nhân vật lịch sử ';
    this.formState.formType = formType;
    if (formType === 'add') {
      this.formSave.reset(
        {
          ten: '',
          bietdanh: '',
          mota: '',
          gioitinh: null,
          nam: '',
          files: null,
          giaidoan_lichsu: '',

        }
      )
      this.characterAvatar = '';
    } else {
      this.formState.object = object;
      this.formSave.reset(
        {
          ten: object.ten,
          bietdanh: object.bietdanh,
          mota: object.mota,
          gioitinh: object.gioitinh,
          nam: object.nam,
          files: object.files,
          giaidoan_lichsu: object.giaidoan_lichsu,
        }
      );
      this.characterAvatar = object.files ? getLinkDownload(object.files.id) : '';
    }
  }

  btnAdd() {
    this.onOpenFormEdit();
    this.changeInputMode('add');
  }

  btnEdit(object: DmNhanVatLichSu) {
    this.changeInputMode('edit', object);
    this.onOpenFormEdit();
  }

  saveForm() {
    if (this.formSave.valid) {
      if (this.formState.formType === "add") {
        this.notificationService.isProcessing(true);
        this.danhMucNhanVatLichSuService.create(this.formSave.value).subscribe({
          next: () => {
            this.notificationService.isProcessing(false);
            this.notificationService.toastSuccess('Thêm mới thành công');
            this.formSave.reset({
              ten: '',
              bietdanh: '',
              mota: '',
              gioitinh: null,
              nam: '',
              files: null,
              giaidoan_lichsu: '',
            });
          }, error: () => {
            this.notificationService.toastError("Thêm mới thất bại");
            this.notificationService.isProcessing(false);
          }
        })
      } else {
        this.notificationService.isProcessing(false);
        const index = this.listData.findIndex(r => r.id === this.formState.object.id);
        console.log(index);
        this.danhMucNhanVatLichSuService.update(this.listData[index].id, this.formSave.value).subscribe({
          next: () => {
            this.notificationService.isProcessing(false);
            this.notificationService.toastSuccess('Cập nhật thành công');
          }, error: () => {
            this.notificationService.isProcessing(false);
            this.notificationService.toastError("Cập nhật thất bại");
          }

        })
      }
    } else {
      this.notificationService.toastError("Lỗi nhập liệu");
    }
  }

  closeForm() {
    this.notificationService.closeSideNavigationMenu();
    this.loadData(1);
  }

  // loadFileMedia(data: DmNhanVatLichSu): Observable<{ file: OvicFile, blob: Blob }[]> {
  //
  //   console.log(data);
  //
  //   const ids: OvicFile[] = [].concat(
  //     data.files != null ? [...data.files] : null
  //   ).filter(Boolean);
  //   let request: Observable<{ file: OvicFile, blob: Blob }>[] = ids.reduce((collector, file) => {
  //     collector.push(
  //       this.fileService.getFileAsBlobByName(file.id.toString(10)).pipe(map(blob => ({file, blob})))
  //     )
  //     return collector;
  //   }, new Array<Observable<{ file: OvicFile, blob: Blob }>>())
  //   return forkJoin<{ file: OvicFile, blob: Blob }[]>(request);
  // }

  async makeCharacterAvatar(file: File, characterName: string): Promise<File> {
    try {
      const options: AvatarMakerSetting = {
        aspectRatio: 2 / 3,
        resizeToWidth: 200,
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
      console.log(fileChooser.files);
      const file = await this.makeCharacterAvatar(fileChooser.files[0], this.helperService.sanitizeVietnameseTitle(this.f['ten'].value));
      console.log(file);
      // upload file to server
      this.fileService.uploadFile(file, -1).subscribe({
        next: fileUl => {
          this.formSave.get('files').setValue(fileUl);
        }, error: () => {
          this.notificationService.toastError('Upload file không thành công');
        }
      })
      // laasy thoong tin vaf update truongwf
      this.characterAvatar = URL.createObjectURL(file);
      console.log(this.characterAvatar);
      // this.f['files'].setValue()
    }
  }

  infoNhanvalichsu: DmNhanVatLichSu;

  btnShowInfo(object: DmNhanVatLichSu) {
    setTimeout(() => this.notificationService.openSideNavigationMenu({
      name: this.menuName,
      template: this.formInfo,
      size: this.sizeFullWidth,
      offsetTop: '0px',
      offCanvas: false
    }), 100);
    this.infoNhanvalichsu = this.listData.find(f => f.id === object.id)
    // this.infoNhanvalichsu['__giaidoan_lichsu_converted'] = unescape(this.infoNhanvalichsu.giaidoan_lichsu);
    console.log(this.infoNhanvalichsu);
  }
}
