import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {NganHangDeService} from "@shared/services/ngan-hang-de.service";
import {NotificationService} from "@core/services/notification.service";
import {NganHangCauHoi, NganHangDe} from "@shared/models/quan-ly-ngan-hang";
import {FormType, NgPaginateEvent, OvicForm, OvicTableStructure} from "@shared/models/ovic-models";
import {ThemeSettingsService} from "@core/services/theme-settings.service";
import {OvicButton} from "@core/models/buttons";
import {debounceTime, filter, forkJoin, Observable, Subject, Subscription} from "rxjs";
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {FileService} from "@core/services/file.service";
import {NganHangCauHoiService} from "@shared/services/ngan-hang-cau-hoi.service";

interface FormNganHangCauhoi extends OvicForm {
  object: NganHangCauHoi;
}

@Component({
  selector: 'app-ngan-hang-cau-hoi',
  templateUrl: './ngan-hang-cau-hoi.component.html',
  styleUrls: ['./ngan-hang-cau-hoi.component.css']
})
export class NganHangCauHoiComponent implements OnInit {
  @ViewChild('formUpdate', {static: true}) formUpdate: TemplateRef<any>;
  @ViewChild('formAddQuestion', {static: true}) formAddQuestion: TemplateRef<any>;
  btn_checkAdd: 'Lưu lại' | 'Cập nhật';
  isLoading: boolean = false;
  recordsTotal = 1;
  needUpdate: boolean = false;
  search: string = '';
  listData: NganHangDe[];
  dataQuestion: NganHangCauHoi[];
  loadInitFail = false;
  index = 1;
  sizeFullWidth = 1024;
  menuName = 'ADD-QUESTION';
  formActive: NganHangCauHoi;
  _bank_id:number;
  searchQuestion: string
  mode:'TABLE'|'FORM' ="TABLE";
  page = 1;
  rows = this.themeSettingsService.settings.rows;
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
    {
      fieldType: 'normal',
      field: ['count'],
      innerData: true,
      header: 'Số đề đã tạo',
      sortable: false,
      headClass: 'ovic-w-150px text-center',
      rowClass: 'ovic-w-150px text-center'
    },
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
          tooltip: 'Danh sách câu hỏi',
          label: '',
          icon: 'pi pi-book',
          name: 'CREATE_QUESTION_DECISION',
          cssClass: 'btn-warning rounded'
        },
        // {
        //   tooltip: 'Tạo câu hỏi',
        //   label: '',
        //   icon: 'pi pi-user-plus',
        //   name: 'ADD_EXAM',
        //   cssClass: 'btn-secondary rounded'
        // },
      ]
    }
  ];
  subscription = new Subscription();
  formSave: FormGroup;
  private OBSERVE_PROCESS_FORM_DATA = new Subject<FormNganHangCauhoi>();

  listForm = {
    [FormType.ADDITION]: {type: FormType.ADDITION, title: 'Thêm mới câu hỏi', object: null, data: null},
    [FormType.UPDATE]: {type: FormType.UPDATE, title: 'Cập nhật câu hỏi ', object: null, data: null}
  };

  constructor(
    private nganHangDeService: NganHangDeService,
    private notificationService: NotificationService,
    private themeSettingsService: ThemeSettingsService,
    private fb: FormBuilder,
    private fileService: FileService,
    private nganHangCauHoiService: NganHangCauHoiService
  ) {
    this.formSave = this.fb.group({
      title: ['', Validators.required],
      bank_id: [0, Validators.required],
      answer_options: [[], Validators.required],
      correct_answer: [[], Validators.required]
    })
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
    this.loadData(1);
  }

  loadData(page) {
    this.isLoading = true;
    this.nganHangDeService.load(page, this.search).subscribe({
      next: ({data, recordsTotal}) => {
        this.listData = data.map(m => {
          m['__ten_converted'] = `<b>${m.title}</b><br>` + m.desc;
          m['__time_exam'] = m.time_per_test + ' phút';
          return m;
        });
        this.recordsTotal = recordsTotal;
        this.isLoading = false;

      }, error: () => {
        this.isLoading = false;
        this.notificationService.toastError("Mất kết nối với máy chủ");
      }
    })
  }

  get f(): { [key: string]: AbstractControl<any> } {
    return this.formSave.controls;
  }

  loadQuestion(id: number) {
    this.nganHangCauHoiService.getDataByBankId(id,this.searchQuestion).subscribe({
      next: (data) => {
        this.dataQuestion = data.map(m => {
          m['state'] = 0; // 1: chọn, 0 :bỏ chọn
          return m;
        })
      }, error: () => {
        this.notificationService.isProcessing(false);
        this.notificationService.toastError('Mất kết nối với máy chủ');
      }
    })
  }

  onSearch(text: string) {
    this.search = text;
    this.loadData(1);
  }


  paginate({page}: NgPaginateEvent) {
    this.page = page + 1;
    this.loadData(this.page);
  }

  async handleClickOnTable(button: OvicButton) {
    if (!button) {
      return;
    }
    // const decision = button.data && this.listData ? this.listData.find(u => u.id === button.data) : null;
    switch (button.name) {
      case 'ADD_EXAM':
        this.btn_checkAdd = "Lưu lại";
        this.formSave.reset({
          title: '',
          bank_id: button.data,
          answer_options: [],
          correct_answer: 0,
        });

        break;

      case 'CREATE_QUESTION_DECISION':
        this._bank_id = button.data;
        this.loadQuestion(button.data);
        setTimeout(() => this.notificationService.openSideNavigationMenu({
          name: this.menuName,
          template: this.formAddQuestion,
          size: this.sizeFullWidth,
          offsetTop: '0px',
          offCanvas: false
        }), 100);
        this.mode ="TABLE";
        break;
      default:
        break;
    }
  }
  btnAddExam(){
    this.btn_checkAdd = "Lưu lại";
    this.formSave.reset({
      title: '',
      bank_id: this._bank_id,
      answer_options: [],
      correct_answer: 0,
    });
    this.mode= "FORM"
  }
  closeFormAdd(){
    this.loadQuestion(this._bank_id);
    this.mode = "TABLE";
  }
  closeForm() {
    this.notificationService.closeSideNavigationMenu();
    this.loadData(1);
  }
//=====================add exam=================================
  private __processFrom({data, object, type}: FormNganHangCauhoi) {
    const observer$: Observable<any> = type === FormType.ADDITION ? this.nganHangCauHoiService.create(data) : this.nganHangCauHoiService.update(object.id, data);
    observer$.subscribe({
      next: () => {
        this.needUpdate = true;
        this.notificationService.toastSuccess('Thao tác thành công', 'Thông báo');
      },
      error: () => this.notificationService.toastError('Thao tác thất bại', 'Thông báo')
    });
  }

  saveForm() {
    const index = this.listData.findIndex(u => u.id === this.formSave.get('bank_id').value);
    forkJoin([
      this.nganHangDeService.update(this.listData[index].id, {total: this.dataQuestion.length + 1}),
      this.nganHangCauHoiService.create(this.formSave.value)
    ]).subscribe({
      next: () => {
        this.formSave.reset(
          {
            title: '',
            answer_options: [],
            correct_answer: 0,
          }
        )
        this.listData[index].total = this.listData[index].total + 1;
        this.notificationService.toastSuccess('Thao tác thành công', 'Thông báo');
      },
      error: () => this.notificationService.toastError('Thao tác thất bại', 'Thông báo')

    })
  }

  btnEdit(item: NganHangCauHoi) {
    if (!item['_formSave']) {
      item['_formSave'] = this.fb.group({
        title: ['', Validators.required],
        bank_id: [0, Validators.required],
        answer_options: [[], Validators.required],
        correct_answer: [0, Validators.required]
      });
    }
    item['_formSave'].reset({
      title: item.title,
      bank_id: item.bank_id,
      answer_options: item.answer_options,
      correct_answer: item.correct_answer,
    });
    item['state'] = 1;
  }

  btnExit(item: NganHangCauHoi) {
    item['state'] = 0;
  }

  async btnDelete(item: NganHangCauHoi) {
    const confirm = await this.notificationService.confirmDelete();
    if (confirm) {
      this.nganHangCauHoiService.delete(item.id).subscribe({
        next: () => {
          this.notificationService.isProcessing(false);
          this.notificationService.toastSuccess('Thao tác thành công');
          this.dataQuestion = this.dataQuestion.filter(f => f.id != item.id);
          console.log(this.dataQuestion.length);
          this.nganHangDeService.update(item.bank_id,{total: this.dataQuestion.length}).subscribe();
        }, error: () => {
          this.notificationService.isProcessing(false);
          this.notificationService.toastError('Thao tác không thành công');
        }
      })
    }
  }

  saveEdit(item: NganHangCauHoi) {
    const newValues = item['_formSave'].value
    this.notificationService.isProcessing(true);
    this.nganHangCauHoiService.update(item.id, newValues).subscribe({
      next: () => {
        // Object.keys(item['_formSave'].value).forEach(key => item[key] = newValues[key]);
        Object.assign(item, newValues);
        item['state'] = 0;
        this.notificationService.isProcessing(false);
        this.notificationService.toastSuccess('Thao tác thành công');
      }, error: () => {
        this.notificationService.isProcessing(false);
        this.notificationService.toastError('Thao tác không thành công');
      }
    })
  }

  onSearchQuestion(text:string){
    this.searchQuestion = text;
    if(this._bank_id){
      this.loadQuestion(this._bank_id);
    }
  }

  btnStartExam(){

  }

}
