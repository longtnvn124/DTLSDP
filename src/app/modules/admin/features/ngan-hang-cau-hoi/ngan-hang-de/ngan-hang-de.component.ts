import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {NganHangDeService} from "@shared/services/ngan-hang-de.service";
import {NotificationService} from "@core/services/notification.service";
import {NganHangDe} from "@shared/models/quan-ly-ngan-hang";
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {FormType, NgPaginateEvent, OvicForm, OvicTableStructure} from "@shared/models/ovic-models";
import {DmNhanVatLichSu} from "@shared/models/danh-muc";
import {debounceTime, filter, Observable, Subject, Subscription, switchMap} from "rxjs";
import {OvicButton} from "@core/models/buttons";
import {ThemeSettingsService} from "@core/services/theme-settings.service";


interface FormNganHangDe extends OvicForm {
  object: NganHangDe;
}

@Component({
  selector: 'app-ngan-hang-de',
  templateUrl: './ngan-hang-de.component.html',
  styleUrls: ['./ngan-hang-de.component.css']
})
export class NganHangDeComponent implements OnInit {
  @ViewChild('fromUpdate', {static: true}) fromUpdate: TemplateRef<any>;
  rows = this.themeSettingsService.settings.rows;
  loadInitFail: false;
  formActive: FormNganHangDe;
  formSave: FormGroup;
  page = 1;
  subscription = new Subscription();
  index: number;
  sizeFullWidth = 1024;
  isLoading = true;
  needUpdate = false;
  menuName: 'nganhangde';
  search: string;
  listData: NganHangDe[];
  recordsTotal: number;
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

  btn_checkAdd: 'Lưu lại' | 'Cập nhật';
  private OBSERVE_PROCESS_FORM_DATA = new Subject<FormNganHangDe>();
  tblStructure: OvicTableStructure[] = [
    {
      fieldType: 'normal',
      field: ['__ten_converted'],
      innerData: true,
      header: 'Tên Ngân hàng',
      sortable: false,

    },
    {
      fieldType: 'normal',
      field: ['total'],
      innerData: true,
      header: 'Tổng số câu hỏi',
      sortable: false,
      headClass: 'ovic-w-150px text-center',
      rowClass: 'ovic-w-150px text-center'
    },
    {
      fieldType: 'normal',
      field: ['number_questions_per_test'],
      innerData: true,
      header: 'Số câu hỏi trong 1 đề',
      sortable: false,
      headClass: 'ovic-w-160px text-center',
      rowClass: 'ovic-w-160px text-center'
    },
    // {
    //   fieldType: 'normal',
    //   field: ['count'],
    //   innerData: true,
    //   header: 'Số đề đã tạo',
    //   sortable: false,
    //   headClass: 'ovic-w-150px text-center',
    //   rowClass: 'ovic-w-150px text-center'
    // },
    {
      fieldType: 'normal',
      field: ['__time_exam'],
      innerData: true,
      header: 'Thời gian thi',
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
      label: 'Thêm ngân hàng',
      name: 'BUTTON_ADD_NEW',
      icon: 'pi-plus pi',
      class: 'p-button-rounded p-button-success ml-3 mr-2'
    },
  ];
  listForm = {
    [FormType.ADDITION]: {type: FormType.ADDITION, title: 'Thêm mới ngân hành đề', object: null, data: null},
    [FormType.UPDATE]: {type: FormType.UPDATE, title: 'Cập nhật ngân hành đề', object: null, data: null}
  };


  constructor(
    private nganHangDeService: NganHangDeService,
    private notificationService: NotificationService,
    private fb: FormBuilder,
    private themeSettingsService: ThemeSettingsService
  ) {
    this.formSave = this.fb.group({
      title: ['', Validators.required],
      desc: [''],
      number_questions_per_test: [null],
      time_per_test: [null, Validators.required],
    });
    const observeProcessFormData = this.OBSERVE_PROCESS_FORM_DATA.asObservable().pipe(debounceTime(100)).subscribe(form => this.__processFrom(form));
    this.subscription.add(observeProcessFormData);
    const observeProcessCloseForm = this.notificationService.onSideNavigationMenuClosed().pipe(filter(menuName => menuName === this.menuName && this.needUpdate)).subscribe(() => this.loadData(this.page));
    this.subscription.add(observeProcessCloseForm);
    const observerOnResize = this.notificationService.observeScreenSize.subscribe(size => this.sizeFullWidth = size.width)
    this.subscription.add(observerOnResize);
  }

  ngOnInit(): void {
    this.loadInit();
  }

  loadInit() {
    this.loadData(1);
  }

  loadData(page) {
    const limit = this.themeSettingsService.settings.rows;
    this.index = (page * limit) - limit + 1;
    this.isLoading = true
    this.nganHangDeService.load(page).subscribe({
      next: ({data, recordsTotal}) => {
        this.listData = data.map(m => {
          m['__ten_converted'] = `<b>${m.title}</b><br>` + m.desc;
          // m['__time_exam'] = (m.time_per_test/60) + ' phút';
          m['__time_exam'] = m.time_per_test + ' phút';
          return m;
        });
        this.recordsTotal = recordsTotal;
        this.isLoading = false
      }, error: () => {
        this.isLoading = false
        this.notificationService.toastError('Mất kết nối với máy chủ');
      }
    })

    // this.nganHangDeService.load(page).pipe(switchMap(list=>{
    //   const list = list;
    //   return list;
    // }))
  }


  get f(): { [key: string]: AbstractControl<any> } {
    return this.formSave.controls;
  }

  onSearch(text: string) {
    this.search = text;
    this.loadData(1);
  }

  paginate({page}: NgPaginateEvent) {
    this.page = page + 1;
    this.loadData(this.page);
  }

  private __processFrom({data, object, type}: FormNganHangDe) {
    // const time_conver = this.f['time_per_test'].value * 60;
    // this.f['time_per_test'].setValue(time_conver);
    const observer$: Observable<any> = type === FormType.ADDITION ? this.nganHangDeService.create(data) : this.nganHangDeService.update(object.id, data);
    observer$.subscribe({
      next: () => {
        this.needUpdate = true;
        this.notificationService.toastSuccess('Thao tác thành công', 'Thông báo');
      },
      error: () => this.notificationService.toastError('Thao tác thất bại', 'Thông báo')
    });
  }

  private preSetupForm(name: string) {
    this.notificationService.isProcessing(false);
    this.notificationService.openSideNavigationMenu({
      name,
      template: this.fromUpdate,
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
        this.btn_checkAdd = "Lưu lại";
        this.formSave.reset({
          title: '',
          desc: '',
          number_questions_per_test: 0,
          time_per_test: 0,
        });
        this.formActive = this.listForm[FormType.ADDITION];
        this.preSetupForm(this.menuName);
        break;
      case 'EDIT_DECISION':
        this.btn_checkAdd = "Cập nhật";

        const object1 = this.listData.find(u => u.id === decision.id);
        this.formSave.reset({
          title: object1.title,
          desc: object1.desc,
          number_questions_per_test: object1.number_questions_per_test,
          time_per_test: object1.time_per_test,
        })
        this.formActive = this.listForm[FormType.UPDATE];
        this.formActive.object = object1;
        this.preSetupForm(this.menuName);
        break;
      case 'DELETE_DECISION':
        const confirm = await this.notificationService.confirmDelete();
        if (confirm) {
          this.nganHangDeService.delete(decision.id).subscribe({
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
