import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {FormType, NgPaginateEvent, OvicForm, OvicTableStructure} from "@shared/models/ovic-models";
import {DmDiemDiTich} from "@shared/models/danh-muc";
import {Paginator} from "primeng/paginator";
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {debounceTime, filter, Observable, Subject, Subscription} from "rxjs";
import {ThemeSettingsService} from "@core/services/theme-settings.service";
import {DanhMucDiemDiTichService} from "@shared/services/danh-muc-diem-di-tich.service";
import {NotificationService} from "@core/services/notification.service";
import {OvicButton} from "@core/models/buttons";
import {MediaVrManagerComponent} from "@shared/components/media-vr-manager/media-vr-manager.component";
import {AuthService} from "@core/services/auth.service";
import {Router} from '@angular/router';
import {MediaService} from "@shared/services/media.service";
import {FileService} from "@core/services/file.service";
import {HelperService} from "@core/services/helper.service";


interface FormDmDiemDiTich extends OvicForm {
  object: DmDiemDiTich;
}

@Component({
  selector: 'app-diem-di-tich',
  templateUrl: './diem-di-tich.component.html',
  styleUrls: ['./diem-di-tich.component.css']
})
export class DiemDiTichComponent implements OnInit {
  @ViewChild('fromUpdate', {static: true}) template: TemplateRef<any>;
  @ViewChild('formMedia') formMedia: TemplateRef<any>;
  @ViewChild(Paginator) paginator: Paginator;
  @ViewChild(MediaVrManagerComponent) MediaVr: MediaVrManagerComponent;
  statusList = [
    {
      value: 1,
      label: 'Active',
      color: '<span class="badge badge--size-normal badge-success w-100">Active</span>'
    },
    {
      value: 0,
      label: 'Inactive',
      color: '<span class="badge badge--size-normal badge-danger w-100">Inactive</span>'
    }
  ];

  tblStructure: OvicTableStructure[] = [
    {
      fieldType: 'normal',
      field: ['ten'],
      innerData: true,
      header: 'Tên',
      sortable: false,
    },
    {
      fieldType: 'normal',
      field: ['__status'],
      innerData: true,
      header: 'Trạng thái',
      sortable: false,
      headClass: 'ovic-w-110px text-center',
      rowClass: 'ovic-w-110px text-center'
    },
    {
      tooltip: '',
      fieldType: 'buttons',
      field: [],
      rowClass: 'ovic-w-110px text-center',
      checker: 'fieldName',
      header: 'Thao tác',
      sortable: false,
      headClass: 'ovic-w-180px text-center',
      buttons: [
        {
          tooltip: 'Thông tin chi tiết ',
          label: '',
          icon: 'pi pi-file',
          name: 'INFORMATION_DECTISION',
          cssClass: 'btn-secondary rounded'
        },
        {
          tooltip: 'Sửa',
          label: '',
          icon: 'pi pi-file-edit',
          name: 'EDIT_DECISION',
          cssClass: 'btn-primary rounded'
        },
        {
          tooltip: 'Xoá',
          label: '',
          icon: 'pi pi-trash',
          name: 'DELETE_DECISION',
          cssClass: 'btn-danger rounded'
        }
      ]
    }
  ];

  headButtons = [
    {
      label: 'Thêm di tích',
      name: 'BUTTON_ADD_NEW',
      icon: 'pi-plus pi',
      class: 'p-button-rounded p-button-success ml-3 mr-2'
    },
  ];

  listForm = {
    [FormType.ADDITION]: {type: FormType.ADDITION, title: 'Thêm mới di tích', object: null, data: null},
    [FormType.UPDATE]: {type: FormType.UPDATE, title: 'Cập nhật di tích', object: null, data: null}
  };

  formActive: FormDmDiemDiTich;
  formSave: FormGroup;

  private OBSERVE_PROCESS_FORM_DATA = new Subject<FormDmDiemDiTich>();

  listData: DmDiemDiTich[];
  rows = this.themeSettingsService.settings.rows;
  loadInitFail = false;
  subscription = new Subscription();
  sizeFullWidth = 1024;
  isLoading = true;
  needUpdate = false;
  menuName: 'diem-truy-cap';
  btn_checkAdd:'Lưu lại'|'Cập nhật';
  page = 1;

  recordsTotal = 0;

  index = 1;
  filter = {
    search: ''
  }

  dataBinding: any;

  filePermission = {
    canDelete: true,
    canDownload: true,
    canUpload: true
  };
  filePermistionOnlyShow = {canDelete: false, canDownload: true, canUpload: false};
  visible: boolean = false;

  constructor(
    private themeSettingsService: ThemeSettingsService,
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private danhMucDiemDiTichService: DanhMucDiemDiTichService,
    private auth: AuthService,
    private router: Router,
    private mediaService: MediaService,
    private fileService: FileService,
    private helperService: HelperService,
  ) {
    this.formSave = this.fb.group({
      ten: ['', Validators.required],
      mota: [''],
      status: ['', Validators.required],
      toado:['']
    });

    const observeProcessFormData = this.OBSERVE_PROCESS_FORM_DATA.asObservable().pipe(debounceTime(100)).subscribe(form => this.__processFrom(form));
    this.subscription.add(observeProcessFormData);
    const observeProcessCloseForm = this.notificationService.onSideNavigationMenuClosed().pipe(filter(menuName => menuName === this.menuName && this.needUpdate)).subscribe(() => this.loadData(this.page));
    this.subscription.add(observeProcessCloseForm);
    const observerOnResize = this.notificationService.observeScreenSize.subscribe(size => this.sizeFullWidth = size.width)
    this.subscription.add(observerOnResize);
  }

  ngOnInit(): void {
    this.loadInit()
  }

  loadInit() {
    this.isLoading = true;
    this.loadData(1);
  }

  loadData(page) {
    const limit = this.themeSettingsService.settings.rows;
    this.index = (page * limit) - limit + 1;
    this.danhMucDiemDiTichService.search(page, null, this.filter.search).subscribe({
      next: ({data, recordsTotal}) => {
        this.recordsTotal = recordsTotal;
        this.listData = data.map(m => {
          const sIndex = this.statusList.findIndex(i => i.value === m.status);
          m['__status'] = sIndex !== -1 ? this.statusList[sIndex].color : '';
          // m['__fileMedia_converted'] = m.ds_ngulieu ==[] ||m.ds_ngulieu == null?null :this.fileService.getPreviewLinkLocalFile(m.ds_ngulieu[0]);

          // m['__ten_converted'] = `<b>${m.ten}</b> <br>` + m.mota;
          // m['__duongdan']=m.toado_map + ' ' + `<a href="${m.toado_map}" target="_blank"><i class="pi pi-map"></i></a>`;
          return m;
        })
        this.isLoading = false;
      }, error: () => {
        this.isLoading = false;
        this.notificationService.toastError('Mất kết nối với máy chủ');
      }
    })
  }

  private __processFrom({data, object, type}: FormDmDiemDiTich) {
    const observer$: Observable<any> = type === FormType.ADDITION ? this.danhMucDiemDiTichService.create(data) : this.danhMucDiemDiTichService.update(object.id, data);
    observer$.subscribe({
      next: () => {
        this.needUpdate = true;

        if (type === FormType.ADDITION) {
          this.formSave.reset({
            ten: '',
            mota: '',
            status: '',
            toado:''
          });
        }
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

  onSearch(text: string) {
    this.filter.search = text;
    this.paginator.changePage(1);
    this.loadData(1);
  }

  private preSetupForm(name: string) {
    this.notificationService.isProcessing(false);
    this.notificationService.openSideNavigationMenu({
      name:this.menuName,
      template: this.template,
      size: 600,
      offsetTop: '0px'
    });
  }

  closeForm() {
    this.loadInit();
    this.notificationService.closeSideNavigationMenu(this.menuName);
  }

  async handleClickOnTable(button: OvicButton) {
    if (!button) {
      return;
    }
    const decision = button.data && this.listData ? this.listData.find(u => u.id === button.data) : null;
    switch (button.name) {
      case 'BUTTON_ADD_NEW':
        this.btn_checkAdd= "Lưu lại";
        this.formSave.reset({
          ten: '',
          mota: '',
          status: null,
          toado:''
        });
        // this.characterAvatar = ''
        this.formActive = this.listForm[FormType.ADDITION];
        this.preSetupForm(this.menuName);
        break;
      case 'EDIT_DECISION':
        this.btn_checkAdd="Cập nhật"
        const object1 = this.listData.find(u => u.id === decision.id);
        this.formSave.reset({
          ten: object1.ten,
          mota: object1.mota,
          status: object1.status,
          toado:object1.toado
        });
        // this.characterAvatar = object1.ds_ngulieu ? getLinkDownload(object1.ds_ngulieu['id']) : '';
        this.formActive = this.listForm[FormType.UPDATE];
        this.formActive.object = object1;
        this.preSetupForm(this.menuName);
        break;
      case 'DELETE_DECISION':
        const confirm = await this.notificationService.confirmDelete();
        if (confirm) {
          this.danhMucDiemDiTichService.delete(decision.id).subscribe({
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
      case 'INFORMATION_DECTISION':
        this.dataInformation = this.listData.find(u => u.id === decision.id);
        this.visible = true;
        break;
      case 'MEDIA_DECISION':
        this.dataBinding = this.listData.find(u => u.id === decision.id);
        // this.dataBinding = this.auth.encryptData(`${data}`);
        // console.log(dataBinding);
        const code = this.auth.encryptData(`${this.dataBinding.id}`);
        this.router.navigate(['admin/danh-muc/media-vr-manager'], {queryParams: {code}});
        break
      default:
        break;
    }
  }

  dataInformation: DmDiemDiTich;

  saveForm() {
    if (this.formSave.valid) {
      this.formActive.data = this.formSave.value;
      this.OBSERVE_PROCESS_FORM_DATA.next(this.formActive);
    } else {
      this.formSave.markAllAsTouched();
      this.notificationService.toastError('Vui lòng điền đầy đủ thông tin');
    }
  }

  // btnControlVolume() {
  //   // this.MediaVr.toggleVolume();
  // }

  // async makeCharacterAvatar(file: File, characterName: string): Promise<File> {
  //   try {
  //     const options: AvatarMakerSetting = {
  //       aspectRatio: 3 / 2,
  //       resizeToWidth: 300,
  //       format: 'jpeg',
  //       cropperMinWidth: 10,
  //       dirRectImage: {
  //         enable: true,
  //         dataUrl: URL.createObjectURL(file)
  //       }
  //     };
  //     const avatar = await this.mediaService.callAvatarMaker(options);
  //     if (avatar && !avatar.error && avatar.data) {
  //       const none = new Date().valueOf();
  //       const fileName = characterName + none + '.jpg';
  //       return Promise.resolve(this.fileService.base64ToFile(avatar.data.base64, fileName));
  //     } else {
  //       return Promise.resolve(null);
  //     }
  //   } catch (e) {
  //     this.notificationService.isProcessing(false);
  //     this.notificationService.toastError('Quá trình tạo avatar thất bại');
  //     return Promise.resolve(null);
  //   }
  // }
  //
  // characterAvatar: string;
  //
  // async onInputAvatar(event, fileChooser: HTMLInputElement) {
  //   if (fileChooser.files && fileChooser.files.length) {
  //     const file = await this.makeCharacterAvatar(fileChooser.files[0], this.helperService.sanitizeVietnameseTitle(this.f['ten'].value));
  //     // upload file to server
  //     this.fileService.uploadFile(file, 1).subscribe({
  //       next: fileUl => {
  //         if(fileUl != null){
  //           this.formSave.get('ds_ngulieu').setValue([fileUl]);
  //         }else{
  //           this.formSave.get('ds_ngulieu').setValue(null);
  //         }
  //       }, error: () => {
  //         this.notificationService.toastError('Upload file không thành công');
  //       }
  //     })
  //     // laasy thoong tin vaf update truongwf
  //     this.characterAvatar = URL.createObjectURL(file);;
  //   }
  // }

}
