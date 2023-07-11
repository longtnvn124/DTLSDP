import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {FormType, NgPaginateEvent, OvicForm, OvicTableStructure} from "@shared/models/ovic-models";
import {DsSuKien} from "@shared/models/quan-ly-ngu-lieu";
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
import {DmDiemDiTich, DmLinhVuc} from "@shared/models/danh-muc";
import {OvicButton} from "@core/models/buttons";
import {NguLieuSuKienService} from "@shared/services/ngu-lieu-su-kien.service";
interface FormDsSuKien extends OvicForm {
  object: DsSuKien;
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

  listData: DsSuKien[];

  filePermission = {
    canDelete: true,
    canDownload: true,
    canUpload: true
  };
  tblStructure: OvicTableStructure[] = [
    {
      fieldType: 'normal',
      field: ['__title_converted'],
      innerData: true,
      header: 'Tên sự kiện lịch sử, văn hoá địa phương',
      sortable: false,
    },
    {
      fieldType: 'normal',
      field: ['__diemditich_converted'],
      innerData: true,
      header: 'Diễn ra tại',
      sortable: false,
      headClass: 'ovic-w-250px text-left',
      rowClass: 'ovic-w-250px text-left'
    },
    {
      fieldType: 'normal',
      field: ['__time_converted'],
      innerData: false,
      header: 'Thời gian diễn ra',
      sortable: false,
      headClass: 'ovic-w-200px text-center',
      rowClass: 'ovic-w-200px text-center'
    },
    {
      tooltip: '',
      fieldType: 'buttons',
      field: [],
      rowClass: 'ovic-w-110px text-center',
      checker: 'fieldName',
      header: 'Thao tác',
      sortable: false,
      headClass: 'ovic-w-120px text-center',
      buttons: [
        {
          tooltip: 'Chi tiết',
          label: '',
          icon: 'pi pi-file',
          name: 'INFO_DECISION',
          cssClass: 'btn-warning rounded'
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
  formActive: FormDsSuKien;
  formSave: FormGroup;

  private OBSERVE_PROCESS_FORM_DATA = new Subject<FormDsSuKien>();

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
    private nguLieuSuKienService:NguLieuSuKienService
  ) {
    this.formSave = this.fb.group({
      title: ['', Validators.required],
      mota: [''],
      linhvuc: ['', Validators.required],
      diemditich_id: [null, Validators.required],
      thoigian_batdau:['',Validators.required],
      thoigian_ketthuc:['',Validators.required],
      file_quyetdinh: [null],

    });

    const observeProcessFormData = this.OBSERVE_PROCESS_FORM_DATA.asObservable().pipe(debounceTime(100)).subscribe(form => this.__processFrom(form));
    this.subscription.add(observeProcessFormData);
    const observeProcessCloseForm = this.notificationService.onSideNavigationMenuClosed().pipe(filter(menuName => menuName === this.menuName && this.needUpdate)).subscribe(() => this.loadData(this.page));
    this.subscription.add(observeProcessCloseForm);
    const observerOnResize = this.notificationService.observeScreenSize.subscribe(size => this.sizeFullWidth = size.width)
    this.subscription.add(observerOnResize);
  }

  dataDiemditich: DmDiemDiTich[];
  dataLinhvuc: DmLinhVuc[];

  ngOnInit(): void {
    forkJoin<[DmDiemDiTich[], DmLinhVuc[]]>(
      this.danhMucDiemDiTichService.getDataUnlimit(),
      this.danhMucLinhVucService.getDataUnlimit()
    ).subscribe({
      next: ([dataDiemditich, dataLinhvuc]) => {
        this.dataDiemditich = dataDiemditich;
        this.dataLinhvuc = dataLinhvuc;
        this.loadInit();
      },
      error: () => {
        this.notificationService.isProcessing(false);
        this.notificationService.toastError('Mất kết nối với máy chủ');
      }
    })
    // forkJoin<[DmDiemDiTich[], fileConvent[], Point[]]>([of(list), this.loadFileMedia(list[0]),

  }

  loadInit() {
    this.isLoading = true;
    this.loadData(1);
  }

  loadData(page) {
    const limit = this.themeSettingsService.settings.rows;
    this.index = (page * limit) - limit + 1;
    this.page = page;
    this.nguLieuSuKienService.searchData(page, this.search).subscribe({
      next: ({data, recordsTotal}) => {
        this.recordsTotal = recordsTotal;
       this.listData =data.map(m =>{
         m['__title_converted'] = m.title;
         m['__time_converted'] = m.thoigian_batdau +' - ' +m.thoigian_ketthuc;
         m['__diemditich_converted'] =this.dataDiemditich && m.diemditich_id ? this.dataDiemditich.find(f=>f.id === m.diemditich_id).ten : null;
         return m ;
       })
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

  private __processFrom({data, object, type}: FormDsSuKien) {
    const observer$: Observable<any> = type === FormType.ADDITION ? this.nguLieuSuKienService.create(data) : this.nguLieuSuKienService.update(object.id, data);
    observer$.subscribe({
      next: () => {
        if(type === FormType.ADDITION){
          this.formSave.reset({
            title: '',
            mota: '',
            linhvuc: '',
            diemditich_id: null,
            thoigian_batdau:'',
            thoigian_ketthuc:'',
            file_quyetdinh: null,
          });
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
    const decision = button.data && this.listData ? this.listData.find(u => u.id === button.data) : null;
    switch (button.name) {
      case 'BUTTON_ADD_NEW':
        this.formSave.reset({
          title: '',
          mota: '',
          linhvuc: '',
          diemditich_id: null,
          thoigian_batdau:'',
          thoigian_ketthuc:'',
          file_quyetdinh: null,

        });
        this.formActive = this.listForm[FormType.ADDITION];
        this.preSetupForm(this.menuName);
        break;
      case 'EDIT_DECISION':
        console.log(decision.id)
        const object1 = this.listData.find(u => u.id === decision.id);
        this.formSave.reset({
          title: object1.title,
          mota: object1.mota,
          linhvuc: object1.linhvuc,
          diemditich_id:object1.diemditich_id,
          thoigian_batdau:object1.thoigian_batdau,
          thoigian_ketthuc:object1.thoigian_ketthuc,
          file_quyetdinh: object1.file_quyetdinh,
        })
        this.formActive = this.listForm[FormType.UPDATE];
        this.formActive.object = object1;
        this.preSetupForm(this.menuName);
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
        this.dataInfo = this.listData.find(f =>f.id === decision.id);
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
  dataInfo:DsSuKien;
  saveForm() {
    if (this.formSave.valid) {
      this.formActive.data = this.formSave.value;
      this.OBSERVE_PROCESS_FORM_DATA.next(this.formActive);
    } else {
      this.formSave.markAllAsTouched();
      this.notificationService.toastError('Vui lòng điền đầy đủ thông tin');
    }
  }

}
