import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {Paginator} from "primeng/paginator";
import {FormType, NgPaginateEvent, OvicForm, OvicTableStructure} from "@shared/models/ovic-models";
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {debounceTime, filter, forkJoin, Observable, Subject, Subscription} from "rxjs";
import {ThemeSettingsService} from "@core/services/theme-settings.service";
import {NotificationService} from "@core/services/notification.service";
import {AuthService} from "@core/services/auth.service";
import {HelperService} from "@core/services/helper.service";
import {OvicButton} from "@core/models/buttons";
import {DsNgulieu} from "@shared/models/quan-ly-ngu-lieu";
import {NguLieuDanhSachService} from "@shared/services/ngu-lieu-danh-sach.service";
import {DanhMucChuyenMucService} from "@shared/services/danh-muc-chuyen-muc.service";
import {DanhMucDiemDiTichService} from "@shared/services/danh-muc-diem-di-tich.service";
import {DanhMucLinhVucService} from "@shared/services/danh-muc-linh-vuc.service";
import {DanhMucLoaiNguLieuService} from "@shared/services/danh-muc-loai-ngu-lieu.service";
import {DmChuyenMuc, DmDiemDiTich, DmLinhVuc, DmLoaiNguLieu} from "@shared/models/danh-muc";
import {DiemDiTichComponent} from "@modules/admin/features/danh-muc/diem-di-tich/diem-di-tich.component";

interface FormNgulieu extends OvicForm {
  object: DsNgulieu;
}

@Component({
  selector: 'app-danh-sach-ngu-lieu',
  templateUrl: './danh-sach-ngu-lieu.component.html',
  styleUrls: ['./danh-sach-ngu-lieu.component.css']
})
export class DanhSachNguLieuComponent implements OnInit {
  @ViewChild('fromUpdate', {static: true}) template: TemplateRef<any>;
  @ViewChild('formMembers', {static: true}) formMembers: TemplateRef<any>;
  @ViewChild(Paginator) paginator: Paginator;
  listData: DmDiemDiTich[];

  filePermission = {
    canDelete: true,
    canDownload: true,
    canUpload: true
  };
  tblStructure: OvicTableStructure[] = [
    {
      fieldType: 'normal',
      field: ['ten'],
      innerData: true,
      header: 'Tiêu đề ngữ liệu ',
      sortable: false,
    },
    {
      fieldType: 'normal',
      field: ['__diemditich_converted'],
      innerData: true,
      header: 'Điểm di tích',
      sortable: false,
      headClass: 'ovic-w-250px text-left',
      rowClass: 'ovic-w-250px text-left'
    },
    {
      fieldType: 'normal',
      field: ['loaingulieu'],
      innerData: false,
      header: 'Loai ngữ liệu',
      sortable: false,
      headClass: 'ovic-w-180px text-center',
      rowClass: 'ovic-w-180px text-center'
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
      label: 'Thêm ngữ liệu',
      name: 'BUTTON_ADD_NEW',
      icon: 'pi-plus pi',
      class: 'p-button-rounded p-button-success ml-3 mr-2'
    },
  ];
  listForm = {
    [FormType.ADDITION]: {type: FormType.ADDITION, title: 'Thêm mới ngữ liệu', object: null, data: null},
    [FormType.UPDATE]: {type: FormType.UPDATE, title: 'Cập nhật ngữ liệu', object: null, data: null}
  };
  formActive: FormNgulieu;
  formSave: FormGroup;

  private OBSERVE_PROCESS_FORM_DATA = new Subject<FormNgulieu>();

  rows = this.themeSettingsService.settings.rows;
  loadInitFail = false;
  subscription = new Subscription();
  sizeFullWidth = 1024;
  isLoading = true;
  needUpdate = false;

  menuName: 'ds_ngulieu';
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
  ) {
    this.formSave = this.fb.group({
      title: ['', Validators.required],
      mota: [''],
      loaingulieu: ['', Validators.required],
      linhvuc: ['', Validators.required],
      chuyenmuc: ['', Validators.required],
      diemditich_id: [null, Validators.required],
      file_media: [null],
      file_audio: [null],
    });

    const observeProcessFormData = this.OBSERVE_PROCESS_FORM_DATA.asObservable().pipe(debounceTime(100)).subscribe(form => this.__processFrom(form));
    this.subscription.add(observeProcessFormData);
    const observeProcessCloseForm = this.notificationService.onSideNavigationMenuClosed().pipe(filter(menuName => menuName === this.menuName && this.needUpdate)).subscribe(() => this.loadData(this.page));
    this.subscription.add(observeProcessCloseForm);
    const observerOnResize = this.notificationService.observeScreenSize.subscribe(size => this.sizeFullWidth = size.width)
    this.subscription.add(observerOnResize);
  }

  dataDiemditich: DmDiemDiTich[];
  dataChuyemuc: DmChuyenMuc[];
  dataLoaingulieu: DmLoaiNguLieu[];
  dataLinhvuc: DmLinhVuc[];

  ngOnInit(): void {
    forkJoin<[DmDiemDiTich[], DmChuyenMuc[], DmLoaiNguLieu[], DmLinhVuc[]]>(
      this.danhMucDiemDiTichService.getDataUnlimit(),
      this.danhMucChuyenMucService.getDataUnlimit(),
      this.danhMucLoaiNguLieuService.getDataUnlimit(),
      this.danhMucLinhVucService.getDataUnlimit()
    ).subscribe({
      next: ([dataDiemditich, dataChuyemuc, dataLoaingulieu, dataLinhvuc]) => {
        this.dataDiemditich = dataDiemditich;
        this.dataChuyemuc = dataChuyemuc;
        this.dataLoaingulieu = dataLoaingulieu;
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

  loadData(page){
      this.isLoading=true;
      const limit = this.themeSettingsService.settings.rows;
      this.index = (page * limit) - limit + 1;
      this.page = page;
      this.danhMucDiemDiTichService.getDataByIsactive(page,this.search).subscribe({
        next:({data,recordsTotal})=>{
          this.recordsTotal = recordsTotal;
          this.listData =data;
          this.isLoading=false;
          this.notificationService.isProcessing(false);
          },
        error:()=>{
          this.isLoading=false;
          this.notificationService.isProcessing(false);
          this.notificationService.toastError('Mất kết nối với máy chủ');
        }
      })
  }
  // loadData(page) {
  //   const limit = this.themeSettingsService.settings.rows;
  //   this.index = (page * limit) - limit + 1;
  //   this.page = page;
  //   this.nguLieuDanhSachService.searchData(page, this.search).subscribe({
  //     next: (data) => {
  //       this.listData = data.map(m=>{
  //         m['__ten_converted'] = `<b>${m.title}</b><br>` + m.mota;
  //         m['__diemditich_converted'] = this.dataDiemditich.find(f=>f.id === m.diemditich_id).ten;
  //         return m;
  //       })
  //       this.isLoading = false;
  //       this.notificationService.isProcessing(false);
  //     },
  //     error: () => {
  //       this.isLoading = false;
  //       this.notificationService.isProcessing(false);
  //       this.notificationService.toastError('Mất kết nối với máy chủ');
  //     }
  //   })
  // }

  private __processFrom({data, object, type}: FormNgulieu) {
    const observer$: Observable<any> = type === FormType.ADDITION ? this.nguLieuDanhSachService.create(data) : this.nguLieuDanhSachService.update(object.id, data);
    observer$.subscribe({
      next: () => {
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
          loaingulieu: [],
          linhvuc: '',
          chuyenmuc: '',
          diemditich_id: null,
          file_media: null,
          file_audio: null,
        });
        this.formActive = this.listForm[FormType.ADDITION];
        this.preSetupForm(this.menuName);
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

}
