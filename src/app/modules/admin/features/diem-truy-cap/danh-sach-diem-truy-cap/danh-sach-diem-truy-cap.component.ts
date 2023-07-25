import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {Paginator} from "primeng/paginator";
import {MediaVrManagerComponent} from "@shared/components/media-vr-manager/media-vr-manager.component";
import {FormType, NgPaginateEvent, OvicForm, OvicTableStructure} from "@shared/models/ovic-models";
import {AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators} from "@angular/forms";
import {debounceTime, filter, forkJoin, Observable, Subject, Subscription} from "rxjs";
import {DmDiemDiTich,DmLoaiNguLieu} from "@shared/models/danh-muc";
import {ThemeSettingsService} from "@core/services/theme-settings.service";
import {NotificationService} from "@core/services/notification.service";
import {DanhMucDiemDiTichService} from "@shared/services/danh-muc-diem-di-tich.service";
import {AuthService} from "@core/services/auth.service";
import {FileService} from "@core/services/file.service";
import {OvicButton} from "@core/models/buttons";
import {Point} from "@shared/models/point";
import {PointsService} from "@shared/services/points.service";
import {DanhMucLinhVucService} from "@shared/services/danh-muc-linh-vuc.service";
import {DanhMucLoaiNguLieuService} from "@shared/services/danh-muc-loai-ngu-lieu.service";
import {Ngulieu} from "@shared/models/quan-ly-ngu-lieu";
import {EmployeesPickerService} from "@shared/services/employees-picker.service";
import {TypeOptions} from "@shared/utils/syscat";

interface FormDiemTruyCap extends OvicForm {
  object: Point;
}

const PinableValidator = (control: AbstractControl): ValidationErrors | null => {
  if (control.get('type').valid && control.get('type').value) {
    if (control.get('type').value === 'DIRECT') {
      return control.get('ds_ngulieu').value && Array.isArray(control.get('ds_ngulieu').value) && control.get('ds_ngulieu').value.some(nl => ['image360', 'video360'].includes(nl['loaingulieu'])) ? null : {invalidPinable: true}
    } else {
      return null;
    }
  } else {
    return {invalid: true};
  }
}

@Component({
  selector: 'app-danh-sach-diem-truy-cap',
  templateUrl: './danh-sach-diem-truy-cap.component.html',
  styleUrls: ['./danh-sach-diem-truy-cap.component.css']
})
export class DanhSachDiemTruyCapComponent implements OnInit {

  @ViewChild('fromUpdate', {static: true}) template: TemplateRef<any>;
  @ViewChild('formMedia') formMedia: TemplateRef<any>;
  @ViewChild(Paginator) paginator: Paginator;
  @ViewChild(MediaVrManagerComponent) MediaVr: MediaVrManagerComponent;

  filePermission = {
    canDelete: true,
    canDownload: true,
    canUpload: true
  };
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
  typeOptions = TypeOptions;

  destination: Ngulieu;

  otherInfo: Ngulieu[];

  tblStructure: OvicTableStructure[] = [
    {
      fieldType: 'normal',
      field: ['__diemditich_converted'],
      innerData: true,
      header: 'Tiêu đề điểm  truy cập',
      sortable: false,

    },
    {
      fieldType: 'normal',
      field: ['type'],
      innerData: true,
      header: 'loai',
      sortable: false,
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
          tooltip: 'Truy cập Vr360',
          label: '',
          icon: 'pi pi-globe',
          name: 'MEDIA_DECISION',
          cssClass: 'btn-warning rounded',
          conditionField: 'type',
          conditionValue: 'DIRECT'
        },
        {
          tooltip: 'Truy cập Vr360',
          label: '',
          icon: 'pi pi-globe',
          name: '__no_actions',
          cssClass: 'btn-secondary ovic-button--invisible rounded',
          conditionField: 'type',
          conditionValue: 'INFO'
        },
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
      label: 'Thêm điểm truy cập',
      name: 'BUTTON_ADD_NEW',
      icon: 'pi-plus pi',
      class: 'p-button-rounded p-button-success ml-3'
    },
  ];

  listForm = {
    [FormType.ADDITION]: {type: FormType.ADDITION, title: 'Thêm mới di tích', object: null, data: null},
    [FormType.UPDATE]: {type: FormType.UPDATE, title: 'Cập nhật di tích', object: null, data: null}
  };

  formSave: FormGroup;

  private OBSERVE_PROCESS_FORM_DATA = new Subject<FormDiemTruyCap>();
  formActive: FormDiemTruyCap;
  data: Point[];
  rows = this.themeSettingsService.settings.rows;
  subscription = new Subscription();
  sizeFullWidth = 1024;
  isLoading = true;

  error = false;
  needUpdate = false;
  menuName: 'dm_diem-truy-cap';
  page = 1;
  recordsTotal = 0;
  index = 1;
  filter = {
    search: ''
  }

  constructor(
    private themeSettingsService: ThemeSettingsService,
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private danhMucDiemDiTichService: DanhMucDiemDiTichService,
    private pointsService: PointsService,
    private auth: AuthService,
    private fileService: FileService,
    private danhMucLoaiNguLieuService: DanhMucLoaiNguLieuService,
    private danhMucLinhVucService: DanhMucLinhVucService,
    private employeesPickerService: EmployeesPickerService
  ) {
    this.formSave = this.fb.group({
      icon: ['', Validators.required],
      title: ['', Validators.required],
      mota: ['',],
      vitri_ggmap: [''],
      type: ['', Validators.required],
      ds_ngulieu: [[], Validators.required],
      parent_id: ['', Validators.required],
      donvi_id: [null, Validators.required],
      ditich_id: [null, Validators.required],
      root: [null, Validators.required],
    }, {
      validators: PinableValidator
    });

    this.formSave.get('type').valueChanges.subscribe(value => {
      if (this.f['ds_ngulieu'].value && Array.isArray(this.f['ds_ngulieu'].value)) {
        if (value === 'DIRECT') {
          this.destination = this.f['ds_ngulieu'].value.find(n => ['image360', 'video360'].includes(n['loaingulieu']));
          this.otherInfo = this.f['ds_ngulieu'].value.filter(n => !['image360', 'video360'].includes(n['loaingulieu']));
        } else {
          this.destination = null;
          this.otherInfo = this.f['ds_ngulieu'].value;
        }
      } else {
        this.destination = null;
        this.otherInfo = [];
      }
    });


    this.formSave.get('ds_ngulieu').valueChanges.subscribe(value => {
      if (value && Array.isArray(value)) {
        if (this.formSave.get('type').value === 'DIRECT') {
          this.destination = this.f['ds_ngulieu'].value.find(n => ['image360', 'video360'].includes(n['loaingulieu']));
          this.otherInfo = this.f['ds_ngulieu'].value.filter(n => !['image360', 'video360'].includes(n['loaingulieu']));
        } else {
          this.destination = null;
          this.otherInfo = this.f['ds_ngulieu'].value;
        }
      } else {
        this.destination = null;
        this.otherInfo = [];
      }
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

  dataLoaingulieu: DmLoaiNguLieu[];
  dataDiemditich: DmDiemDiTich[];

  loadInit() {
    this.isLoading = true;
    forkJoin<[DmLoaiNguLieu[], DmDiemDiTich[]]>(
      this.danhMucLoaiNguLieuService.getDataUnlimit(),
      this.danhMucDiemDiTichService.getDataUnlimit(),
    ).subscribe({
      next: ([dataLoaingulieu, dataDiemditich]) => {
        this.dataLoaingulieu = dataLoaingulieu;
        this.dataDiemditich = dataDiemditich;
        this.loadData(1);
      },
      error: () => {
        this.notificationService.isProcessing(false);
        this.notificationService.toastError('Mất kết nối với máy chủ');
      }
    })
  }

  loadData(page) {
    const limit = this.themeSettingsService.settings.rows;
    this.index = (page * limit) - limit + 1;
    this.isLoading = true;
    this.pointsService.loadPage(this.page).subscribe({
      next: ({data, recordsTotal}) => {
        this.data = data.map(m => {
          m['__diemditich_converted'] = m.ditich_id ? this.dataDiemditich.find(f => f.id === m.ditich_id).ten : m.title;
          return m;
        });
        this.recordsTotal = recordsTotal;
        this.isLoading = false;
        this.error = false;
      },
      error: () => {
        this.error = true;
        this.isLoading = false;
        this.notificationService.toastError('Mất kết nối mạng');
      },
    });

  }

  private __processFrom({data, object, type}: FormDiemTruyCap) {
    const observer$: Observable<any> = type === FormType.ADDITION ? this.danhMucDiemDiTichService.create(data) : this.danhMucDiemDiTichService.update(object.id, data);
    observer$.subscribe({
      next: () => {
        this.needUpdate = true;
        if (type === FormType.ADDITION) {
          this.formSave.reset({
            icon: '',
            title: '',
            mota: '',
            vitri_ggmap: '',
            type: '',
            ds_ngulieu: [],
            parent_id: null,
            donvi_id: this.auth.userDonViId,
            ditich_id: null,
            root: 0
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
      name,
      template: this.template,
      size: 700,
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
    const decision = button.data && this.data ? this.data.find(u => u.id === button.data) : null;
    switch (button.name) {
      case 'BUTTON_ADD_NEW':
        this.formSave.reset({
          icon: '',
          title: '',
          mota: '',
          vitri_ggmap: '',
          type: '',
          ds_ngulieu: [],
          parent_id: null,
          donvi_id: this.auth.userDonViId,
          ditich_id: null,
          root: 0
        });
        // this.characterAvatar = ''
        this.formActive = this.listForm[FormType.ADDITION];
        this.preSetupForm(this.menuName);
        break;
      case 'EDIT_DECISION':
        const object1 = this.data.find(u => u.id === decision.id);
        this.formSave.reset({
          icon: object1.icon,
          title: object1.title,
          mota: object1.mota,
          vitri_ggmap: object1.vitri_ggmap,
          donvi_id: object1.donvi_id,
          parrent_id: object1.parent_id,
          ds_ngulieu: object1.ds_ngulieu,
          ditich_id: object1.ditich_id,
          root: object1.root
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
              this.page = Math.max(1, this.page - (this.data.length > 1 ? 0 : 1));
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
      default:
        break;
    }
  }

  saveForm() {
    if (this.formSave.valid) {
      this.formActive.data = this.formSave.value;
      this.OBSERVE_PROCESS_FORM_DATA.next(this.formActive);
    } else {
      this.formSave.markAllAsTouched();
      this.notificationService.toastError('Vui lòng điền đầy đủ thông tin');
    }
  }

  onChangeDitich(event) {
    const value = event.value;
    const ditich = this.dataDiemditich.find(f => f.id === value);
    console.log(ditich);
    if (value) {
      this.f['title'].setValue(ditich.ten);
      this.f['mota'].setValue(ditich.mota);
    } else {
      this.f['title'].setValue('');
      this.f['mota'].setValue('');
    }
  }


  dsNgulieu: Ngulieu[];

  async btnAddNgulieu(type) {
    const result = await this.employeesPickerService.pickerNgulieu([], '', type);
    console.log(result);
    const value = [].concat(this.f['ds_ngulieu'].value, result);
    this.f['ds_ngulieu'].setValue(value);
    console.log(this.f['ds_ngulieu'].value);

  }
  deleteNguLieuOnForm(n: Ngulieu) {
    if (this.f['ds_ngulieu'].value && Array.isArray(this.f['ds_ngulieu'].value)) {
      const newValues = this.f['ds_ngulieu'].value.filter(u => u.id !== n.id);
      this.f['ds_ngulieu'].setValue(newValues);
    } else {
      this.f['ds_ngulieu'].setValue([]);
    }
  }
  viewDiemtruycap(n:Ngulieu){

  }
}
