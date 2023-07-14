import {Component, Input, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {Paginator} from "primeng/paginator";
import {FormType, NgPaginateEvent, OvicForm, OvicTableStructure} from "@shared/models/ovic-models";
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {debounceTime, filter, forkJoin, Observable, Subject, Subscription} from "rxjs";
import {ThemeSettingsService} from "@core/services/theme-settings.service";
import {NotificationService} from "@core/services/notification.service";

import {NguLieuDanhSachService} from "@shared/services/ngu-lieu-danh-sach.service";
import {DanhMucChuyenMucService} from "@shared/services/danh-muc-chuyen-muc.service";
import {DanhMucDiemDiTichService} from "@shared/services/danh-muc-diem-di-tich.service";
import {DanhMucLinhVucService} from "@shared/services/danh-muc-linh-vuc.service";
import {DanhMucLoaiNguLieuService} from "@shared/services/danh-muc-loai-ngu-lieu.service";
import {DmChuyenMuc, DmDiemDiTich, DmLinhVuc, DmLoaiNguLieu} from "@shared/models/danh-muc";
import {DsNgulieu} from "@shared/models/quan-ly-ngu-lieu";

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
  @ViewChild(Paginator , { static : true }) paginator: Paginator;
  private OBSERVE_SEARCH_DATA = new Subject<string>();
  formActive: FormNgulieu;
  private OBSERVE_PROCESS_FORM_DATA = new Subject<FormNgulieu>();
  subscription = new Subscription();
  listData:DsNgulieu[];
  recordsTotal:number;
  loadInitFail = false;
  needUpdate = false;
  rows = this.themeSettingsService.settings.rows;
  isLoading:boolean = false;
  page = 1;
  menuName='dsNgulieu';
  sizeFullWidth=1024;
  filePermission = {
    canDelete: true,
    canDownload: true,
    canUpload: true
  };
  labelBtnAcept:string;
  listForm = {
    [FormType.ADDITION]: {type: FormType.ADDITION, title: 'Thêm mới ngữ liệu', object: null, data: null},
    [FormType.UPDATE]: {type: FormType.UPDATE, title: 'Cập nhật ngữ liệu', object: null, data: null}
  };
  formSave:FormGroup= this.fb.group({
    title:['',Validators.required],
    mota:[''],
    chuyenmuc:['',Validators.required],
    loaingulieu:['',Validators.required],
    diemditich_id:[null,Validators.required],
    linhvuc:['',Validators.required],
    file_media:[null],
    file_audio:[null],
  });
  dataChuyemuc:DmChuyenMuc[];
  dataLoaingulieu:DmLoaiNguLieu[];
  dataLinhvuc:DmLinhVuc[];
  dataDiemditich:DmDiemDiTich[];
  constructor(
    private themeSettingsService: ThemeSettingsService,
    private nguLieuDanhSachService:NguLieuDanhSachService,
    private notificationService:NotificationService,
    private fb:FormBuilder,
    private danhMucChuyenMucService:DanhMucChuyenMucService,
    private danhMucLoaiNguLieuService:DanhMucLoaiNguLieuService,
    private danhMucLinhVucService:DanhMucLinhVucService,
    private danhMucDiemDiTichService:DanhMucDiemDiTichService,

  ) {
    const observeProcessFormData = this.OBSERVE_PROCESS_FORM_DATA.asObservable().pipe(debounceTime(100)).subscribe(form => this.__processFrom(form));
    this.subscription.add(observeProcessFormData);
    const observeProcessCloseForm = this.notificationService.onSideNavigationMenuClosed().pipe(filter(menuName => menuName === this.menuName && this.needUpdate)).subscribe(() => this.loadData(this.page));
    this.subscription.add(observeProcessCloseForm);
    const observerOnResize = this.notificationService.observeScreenSize.subscribe(size => this.sizeFullWidth = size.width)
    this.subscription.add(observerOnResize);
    const observerSearchData = this.OBSERVE_SEARCH_DATA.asObservable().pipe( debounceTime( 300 ) ).subscribe( () => {
      this.paginator.changePage( 1 );
      this.loadData( 1 );
    } );
    this.subscription.add( observerSearchData );
  }

  ngOnInit(): void {
    this.loadInit();
  }
  loadInit(){
    forkJoin<[ DmChuyenMuc[], DmLoaiNguLieu[], DmLinhVuc[],DmDiemDiTich[]]>(
      this.danhMucChuyenMucService.getDataUnlimit(),
      this.danhMucLoaiNguLieuService.getDataUnlimit(),
      this.danhMucLinhVucService.getDataUnlimit(),
      this.danhMucDiemDiTichService.getDataUnlimit()
    ).subscribe({
      next: ([dataChuyemuc, dataLoaingulieu, dataLinhvuc,dataDiemditich]) => {
        this.dataChuyemuc = dataChuyemuc;
        this.dataLoaingulieu = dataLoaingulieu;
        this.dataLinhvuc = dataLinhvuc;
        this.dataDiemditich = dataDiemditich;
        this.loadData(1);
      },
      error: () => {
        this.notificationService.isProcessing(false);
        this.notificationService.toastError('Mất kết nối với máy chủ');
      }
    })
  }

  loadData(page:number){
    let i =1;
    this.isLoading= true;
    this.nguLieuDanhSachService.getDataByDiemditichIdAndSearch(page,this.filterData.id_diemditich,this.filterData.search).subscribe({
      next:({data,recordsTotal})=>{
        this.listData = data.map(m=>{
          m['indexTable']= i++;
          m['__ten_converted']= `<b>${m.title}</b><br>` + m.mota;
          m['__diemditich_converted'] = this.dataDiemditich.find(f=>f.id === m.diemditich_id).ten;
          return m ;

        });
        this.isLoading = false;
      },
      error:()=>{
        this.isLoading = false;
        this.notificationService.toastError('Mất kết nối với máy chủ');
      }
    })
  }
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
  get f(): { [key: string]: AbstractControl<any> } {
    return this.formSave.controls;
  }
  btnAddNew(){
    this.formSave.reset({
      title:'',
      mota:'',
      chuyenmuc:'',
      loaingulieu:'',
      diemditich_id:null,
      linhvuc:'',
      file_media:[],
      file_audio:[],
    });
    // this.mode = "FORM";
    this.formActive = this.listForm[FormType.ADDITION];
    this.preSetupForm(this.menuName);
  }
  private preSetupForm(name: string) {
    this.notificationService.isProcessing(false);
    this.notificationService.openSideNavigationMenu({
      name,
      template: this.template,
      size: 600,
      offsetTop: '0px'
    });
  }
  btnEdit(object:DsNgulieu){
    this.formSave.reset({
      title:object.title,
      mota:object.mota,
      chuyenmuc:object.chuyenmuc,
      loaingulieu:object.loaingulieu,
      diemditich_id:object.diemditich_id,
      linhvuc:object.linhvuc,
      file_media:object.file_media,
      file_audio:object.file_audio,
    });
    console.log(object);
    // this.mode = "FORM";
    this.formActive = this.listForm[FormType.UPDATE];
    this.formActive.object = object;
    this.preSetupForm(this.menuName);
  };

  async btnDelete(object:DsNgulieu){
    console.log(object);
    const confirm = await this.notificationService.confirmDelete();
    if (confirm) {
      this.nguLieuDanhSachService.delete(object.id).subscribe({
        next: () => {
          this.page = Math.max(1, this.page - (this.listData.length > 1 ? 0 : 1));
          this.notificationService.isProcessing(false);
          this.notificationService.toastSuccess('Thao tác thành công');
          this.listData.filter(f=>f.id != object.id);
          this.danhMucDiemDiTichService.update(object.diemditich_id,{total_ngulieu:this.listData.length}).subscribe();
        }, error: () => {
          this.notificationService.isProcessing(false);
          this.notificationService.toastError('Thao tác không thành công');
        }
      })
    }
  };
  mode: 'TABLE' | 'FORM' = "TABLE";


  saveForm() {
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
    this.mode ="TABLE";
  }

  btnInformation(object:DsNgulieu){
    console.log(object)
    const loaingulieu= object.loaingulieu;
    if(loaingulieu.find(f=>f === 'Video 360')|| loaingulieu.find(f=>f ==='Hình ảnh 360')) {
      console.log('3d');
    }else{
      console.log('info')
    }
  };
  changeFilter(event){
    const diemditich= event.value;
    this.filterData.id_diemditich = diemditich;
    this.loadData(1);
  }
  changeInput(event:string){
    this.loadData(1);
  }

  filterData:{id_diemditich:number,search:string}=
    {
      id_diemditich:null,
      search:''
    };
}
