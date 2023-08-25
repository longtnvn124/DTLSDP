import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {FormType, NgPaginateEvent, OvicForm, OvicTableStructure} from "@shared/models/ovic-models";
import {Ngulieu, SuKien} from "@shared/models/quan-ly-ngu-lieu";
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
import {DmDiemDiTich,DmNhanVatLichSu} from "@shared/models/danh-muc";
import {OvicButton} from "@core/models/buttons";
import {NguLieuSuKienService} from "@shared/services/ngu-lieu-su-kien.service";
import {DanhMucNhanVatLichSuService} from "@shared/services/danh-muc-nhan-vat-lich-su.service";

import { EmployeesPickerService } from '@modules/shared/services/employees-picker.service';
import { FileService } from '@core/services/file.service';

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
      donvi_id: [null, Validators.required]
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

  ngOnInit(): void {
    this.notificationService.isProcessing(true);
    forkJoin<[DmDiemDiTich[], DmNhanVatLichSu[]]>(
      this.danhMucDiemDiTichService.getDataUnlimit(),
      this.danhMucNhanVatLichSuService.getDataUnlimit()
    ).subscribe({
      next: ([dataDiemditich, dataNhanvatlichsu]) => {
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
    // forkJoin<[DmDiemDiTich[], fileConvent[], Point[]]>([of(list), this.loadFileMedia(list[0]),

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
          return m;
        })
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
            files: null,
            nhanvat_id: null,
            donvi_id: null
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
      name: name,
      template: this.template,
      size: 600,
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
        this.preSetupForm(this.menuName);
        break;
      case 'EDIT_DECISION':
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
        this.dataInfo = this.listData.find(f => f.id === decision.id);
        this.formSave.reset({
          title: this.dataInfo.title,
          mota: this.dataInfo.mota,
          diemditich_ids: this.dataInfo.diemditich_ids,
          thoigian_batdau: this.dataInfo.thoigian_batdau,
          thoigian_ketthuc: this.dataInfo.thoigian_ketthuc,
          files: this.dataInfo.files,
          nhanvat_ids: this.dataInfo.nhanvat_ids,
          donvi_id: this.dataInfo.donvi_id,
          ngulieu_ids:this.dataInfo.ngulieu_ids
        });
        // this.formActive.object = this.dataInfo;
        this.formSave.disable();
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
      files: null,
      nhanvat_ids: null,
      donvi_id: this.auth.userDonViId
    });
    this.formActive = this.listForm[FormType.ADDITION];
    this.preSetupForm(this.menuName);
  }
  btnInformation(id:number){
    this.dataInfo = this.listData.find(f => f.id === id);

    this.formSave.reset({
      title: this.dataInfo.title,
      mota: this.dataInfo.mota,
      diemditich_ids: this.dataInfo.diemditich_ids,
      thoigian_batdau: this.dataInfo.thoigian_batdau,
      thoigian_ketthuc: this.dataInfo.thoigian_ketthuc,
      files: this.dataInfo.files,
      nhanvat_ids: this.dataInfo.nhanvat_ids,
      donvi_id: this.dataInfo.donvi_id,
      ngulieu_ids:this.dataInfo.ngulieu_ids
    });
    // this.formActive.object = this.dataInfo;
    // this.formSave.disable();
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
    })

    this.formSave.enable();
    this.formActive = this.listForm[FormType.UPDATE];
    this.formActive.object = object1;
    this.preSetupForm(this.menuName);

  }
  async btnDelete(id:number){
    const confirm = await this.notificationService.confirmDelete();
    if (confirm) {
      this.nguLieuDanhSachService.delete(id).subscribe({
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
  }
  dataInfo: SuKien;

  saveForm() {
    if (this.formSave.valid) {
      this.formActive.data = this.formSave.value;
      this.OBSERVE_PROCESS_FORM_DATA.next(this.formActive);
    } else {
      this.formSave.markAllAsTouched();
      this.notificationService.toastError('Vui lòng điền đầy đủ thông tin');
    }
  }

  dsNgulieu:Ngulieu[];
  async btnAddNgulieu(type:'DIRECT'|'INFO'){
    const result = await this.employeesPickerService.pickerNgulieu([], '',type);
    this.f['ngulieu_ids'].setValue(result);
    this.dsNgulieu = result;
  }

  btnDowloadNgulieu(btn){
    const file= btn.file_media && btn.file_media[0] ?  this.fileService.getPreviewLinkLocalFile(btn.file_media[0]) :null;
    if(file){
      window.open(file, '_self');
    }else{
      this.notificationService.toastError('Ngữ liệu chưa được gắn file đính kèm');
    }
  }
  btnDeleteNgulieu(id:number){
    const object= this.f['ngulieu_ids'].value;
    this.f['ngulieu_ids'].reset(object.filter(f=>f.id !=id));
  }

}
