import {Component, Input, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {NganHangDeService} from "@shared/services/ngan-hang-de.service";
import {NotificationService} from "@core/services/notification.service";
import {NganHangCauHoi, NganHangDe} from "@shared/models/quan-ly-ngan-hang";
import {NgPaginateEvent, OvicTableStructure} from "@shared/models/ovic-models";
import {ThemeSettingsService} from "@core/services/theme-settings.service";
import {OvicButton} from "@core/models/buttons";
import {forkJoin, Subscription} from "rxjs";
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {FileService} from "@core/services/file.service";
import {NganHangCauHoiService} from "@shared/services/ngan-hang-cau-hoi.service";
import {MODULES_QUILL} from "@shared/utils/syscat";

@Component({
  selector: 'app-ngan-hang-cau-hoi',
  templateUrl: './ngan-hang-cau-hoi.component.html',
  styleUrls: ['./ngan-hang-cau-hoi.component.css']
})
export class NganHangCauHoiComponent implements OnInit {

  @ViewChild('formUpdate', {static: true}) formUpdate: TemplateRef<any>;

  @ViewChild('formAddQuestion', {static: true}) formAddQuestion: TemplateRef<any>;

  @Input() columns: 1 | 2 | 3 | 4 = 1;
  @Input() verticalMode:boolean =false;
  @Input() rawHtml = false;
  module_quill:any = MODULES_QUILL;
  btn_checkAdd: 'Lưu lại' | 'Cập nhật';
  isLoading: boolean = false;
  recordsTotal = 1;
  needUpdate: boolean = false;
  search: string = '';
  listData: NganHangDe[];
  dataQuestion: NganHangCauHoi[] = [];
  loadInitFail = false;
  index = 1;
  sizeFullWidth = 1024;
  menuName = 'ADD-QUESTION';
  formActive: NganHangCauHoi;
  _bank_id: number;
  searchQuestion: string

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

      ]
    }
  ];
  subscription = new Subscription();
  formSave: FormGroup;

  contentHeader: 'Thêm mới câu hỏi' | 'Cập nhật câu hỏi' = "Thêm mới câu hỏi";

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
      correct_answer: [[]]
    })
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
    this.notificationService.isProcessing(true);
    this.nganHangDeService.load(page, this.search).subscribe({
      next: ({data, recordsTotal}) => {
        this.listData = data.map(m => {
          m['__ten_converted'] = `<b>${m.title}</b><br>` + m.desc;
          m['__time_exam'] = m.time_per_test + ' phút';
          return m;
        });
        this.recordsTotal = recordsTotal;
        this.isLoading = false;
        this.notificationService.isProcessing(false);

      }, error: () => {
        this.notificationService.isProcessing(false);
        this.isLoading = false;
        this.notificationService.toastError("Mất kết nối với máy chủ");
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
    switch (button.name) {
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
        this.formSave.reset({
          title: '',
          bank_id: this._bank_id,
          answer_options: [],
          correct_answer: [],
        })

        break;
      default:
        break;
    }
  }

  closeForm() {
    this.notificationService.closeSideNavigationMenu();
    this.loadData(1);
  }

  //==========================================-----------------------------------------
  get f(): { [key: string]: AbstractControl<any> } {
    return this.formSave.controls;
  }

  loadQuestion(id: number) {
    this.notificationService.isProcessing(true);
    this.nganHangCauHoiService.getDataByBankId(id, this.searchQuestion).subscribe({
      next: (data) => {
        this.dataQuestion = data.map(m => {
          m['state'] = 0; // 1: chọn, 0 :bỏ chọn;
          m['_bank_id'] = id;
          return m;
        })

        this.notificationService.isProcessing(false);

      }, error: () => {
        this.notificationService.isProcessing(false);
        this.notificationService.toastError('Mất kết nối với máy chủ');
      }
    })
  }

  onSearchQuestion(text: string) {
    this.searchQuestion = text;
    if (this._bank_id) {
      this.loadQuestion(this._bank_id);
    }
  }


  resetForm() {
    this.contentHeader = "Thêm mới câu hỏi";
    this.formSave.reset(
      {
        title: '',
        bank_id: this._bank_id,
        answer_options: null,
        correct_answer: null,
      }
    )
  }


//=====================add exam=================================
  saveForm() {
    if (this.formSave.valid) {
      if(this.f['correct_answer'].value.length >0 ) {
        const index = this.listData.findIndex(u => u.id === this.formSave.get('bank_id').value);
        forkJoin([
          this.nganHangDeService.update(this._bank_id, {total: this.dataQuestion.length + 1}),
          this.nganHangCauHoiService.create(this.formSave.value)
        ]).subscribe({
          next: () => {
            this.formSave.reset(
              {
                title: '',
                bank_id:this._bank_id,
                answer_options: [],
                correct_answer: [],
              }
            )
            this.listData[index].total = this.listData[index].total + 1;
            this.loadQuestion(this._bank_id);
            this.notificationService.toastSuccess('Thao tác thành công', 'Thông báo');
          },
          error: () => this.notificationService.toastError('Thao tác thất bại', 'Thông báo')
        })
      }
      else{
        this.notificationService.toastWarning('Chưa chọn câu trả lời đúng')
      }


    } else {
      this.notificationService.toastError('Yêu cầu nhập đủ thông tin');
    }

  }

  btnEdit(item: NganHangCauHoi) {
    this.contentHeader = "Cập nhật câu hỏi";
    this.objectEdit = item;
    this.formSave.reset({
      title: this.objectEdit.title,
      bank_id: this._bank_id,
      answer_options: this.objectEdit.answer_options,
      correct_answer: this.objectEdit.correct_answer,
      multiple: this.objectEdit.correct_answer.length > 1 ? 1 : 0
    })
  }

  objectEdit: NganHangCauHoi;

  async btnDelete(item: NganHangCauHoi) {
    const confirm = await this.notificationService.confirmDelete();
    if (confirm) {
      this.nganHangCauHoiService.delete(item.id).subscribe({
        next: () => {
          this.notificationService.isProcessing(false);
          this.notificationService.toastSuccess('Thao tác thành công');
          const count = this.dataQuestion.filter(f => f.id != item.id);
          this.dataQuestion = this.dataQuestion.filter(f => f.id != item.id);
          this.nganHangDeService.update(item.bank_id, {total: count.length}).subscribe();
        }, error: () => {
          this.notificationService.isProcessing(false);
          this.notificationService.toastError('Thao tác không thành công');
        }
      })
    }
  }


  saveEdit() {
    if(this.f['correct_answer'].value.length >0 ) {
      this.notificationService.isProcessing(true);
      this.nganHangCauHoiService.update(this.objectEdit.id, this.formSave.value).subscribe({
        next: () => {

          this.loadQuestion(this._bank_id);
          this.notificationService.isProcessing(false);
          this.notificationService.toastSuccess('Thao tác thành công');
        }, error: () => {
          this.notificationService.isProcessing(false);
          this.notificationService.toastError('Thao tác không thành công');
        }
      })
    }else {
      this.notificationService.toastWarning('Chưa chọn câu trả lời đúng');
    }

  }


}
