import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {FormBuilder} from "@angular/forms";
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  forkJoin,
  of,
  Subject,
  Subscription,
  switchMap,
  takeUntil
} from "rxjs";
import {Shift, ShiftTests, statusOptions} from "@shared/models/quan-ly-doi-thi";
import {NganHangCauHoi, NganHangDe} from "@shared/models/quan-ly-ngan-hang";
import {NgPaginateEvent, OvicTableStructure} from "@shared/models/ovic-models";
import {DotThiDanhSachService} from "@shared/services/dot-thi-danh-sach.service";
import {NotificationService} from "@core/services/notification.service";
import {ThemeSettingsService} from "@core/services/theme-settings.service";
import {NganHangDeService} from "@shared/services/ngan-hang-de.service";
import {HelperService} from "@core/services/helper.service";
import {OvicButton} from "@core/models/buttons";
import {DotThiKetQuaService} from "@shared/services/dot-thi-ket-qua.service";
import {NganHangCauHoiService} from "@shared/services/ngan-hang-cau-hoi.service";
import {ExportExcelService} from "@shared/services/export-excel.service";
import {NewContestant, ThiSinhService} from "@shared/services/thi-sinh.service";


interface DataShiftTest extends ShiftTests {
  index: number;
  _shift_name: string;
  _number_correct_converted: string;
  _bank_id: number;
  _user_name: string;
  _total_exam_time: string;
  _time_loadExam: string;
  _sdt_thiSinh:string;
  _adress_thiSinh:string;
}

@Component({
  selector: 'app-dot-thi-thi-sinh',
  templateUrl: './dot-thi-thi-sinh.component.html',
  styleUrls: ['./dot-thi-thi-sinh.component.css']
})
export class DotThiThiSinhComponent implements OnInit {

  @ViewChild('testTaker', {static: true}) testTaker: TemplateRef<any>;
  private _SEARCH_DEBOUNCE = new Subject<string>();
  private closeObservers$ = new Subject<string>();
  rows = this.themeSettingsService.settings.rows;
  loadInitFail: false;
  page = 1;
  subscription = new Subscription();
  index: number;
  sizeFullWidth = 1024;
  recordsTotal: number;
  isLoading = true;
  needUpdate = false;
  search: string;
  statusOptions = statusOptions;
  menuName = 'DsDotthi';
  listData: Shift[];
  btn_checkAdd: 'Lưu lại' | 'Cập nhật';
  headButtons = [
    {
      label: 'Xuất excel',
      name: 'BUTTON_EXPORT_EXCEL',
      icon: 'pi pi-file-excel',
      class: 'p-button-rounded p-button-success ml-3 mr-2'
    },
  ];

  tblStructureShiftTest: OvicTableStructure[] = [
    {
      fieldType: 'normal',
      field: ['_full_name'],
      innerData: true,
      header: 'Tên thí sinh',
      sortable: false,
    },
    {
      fieldType: 'normal',
      field: ['_time_start_shifttest'],
      innerData: true,
      header: 'Ngày làm bài',
      sortable: false,
      headClass: 'ovic-w-150px text-center',
      rowClass: 'ovic-w-150px text-center'
    },
    {
      fieldType: 'normal',
      field: ['_number_correct_converted'],
      innerData: true,
      header: 'Kết quả làm bài',
      sortable: false,
      headClass: 'ovic-w-100px text-center',
      rowClass: 'ovic-w-100px text-center'
    },
    {
      fieldType: 'normal',
      field: ['_score'],
      innerData: true,
      header: 'Điểm',
      sortable: false,
      headClass: 'ovic-w-100px text-center',
      rowClass: 'ovic-w-100px text-center'
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
          tooltip: 'Chi tiết bài làm',
          label: '',
          icon: 'pi pi-info-circle',
          name: 'DETAIL-EXAM',
          cssClass: 'btn-warning rounded'
        },

      ]
    }
  ]
  nganhangCauhoi: NganHangCauHoi[];
  nganHangDe: NganHangDe[];
  dataUsers: NewContestant[];
  dataShiftTest: DataShiftTest[];
  columns = ['Stt', 'Tên thí sinh', 'Số điện thoại', 'Địa chỉ','Thời gian làm bài', 'Số câu trả lời đúng', 'Điểm',];

  constructor(
    private dotThiDanhSachService: DotThiDanhSachService,
    private notificationService: NotificationService,
    private fb: FormBuilder,
    private themeSettingsService: ThemeSettingsService,
    private nganHangDeService: NganHangDeService,
    private helperService: HelperService,
    private nganHangCauHoiService: NganHangCauHoiService,
    private dotThiKetQuaService: DotThiKetQuaService,
    private exportExcelService: ExportExcelService,
    private thiSinhService: ThiSinhService,
  ) {
    const observeProcessCloseForm = this.notificationService.onSideNavigationMenuClosed().pipe(filter(menuName => menuName === this.menuName && this.needUpdate)).subscribe(() => this.loadData(this.page));
    this.subscription.add(observeProcessCloseForm);
    const observerOnResize = this.notificationService.observeScreenSize.subscribe(size => this.sizeFullWidth = size.width)
    this.subscription.add(observerOnResize);
    this._SEARCH_DEBOUNCE.asObservable().pipe( takeUntil( this.closeObservers$ ) , debounceTime( 500 ) , distinctUntilChanged() ).subscribe( search => this.loadData(1, search));
  }

  ngOnInit(): void {
    this.nganHangDeService.getDataUnlimit().subscribe({
      next: (data) => {
        this.nganHangDe = data;
        this.loadInit();
      }, error: () => {
        this.notificationService.toastError('Mất kết nối với máy chủ');
      }
    })
  }
  loadInit() {
    this.loadData(1);
  }
  strToTime(input: string): string {
    const date = input ? new Date(input) : null;
    let result = '';
    if (date) {
      result += [date.getDate().toString().padStart(2, '0'), (date.getMonth() + 1).toString().padStart(2, '0'), date.getFullYear().toString()].join('/');
      result += ' ' + [date.getHours().toString().padStart(2, '0'), date.getMinutes().toString().padStart(2, '0')].join(':');
    }
    return result;
  }

  loadData(page, search?:string, date?:string) {
    const dataSearch = search ?search: this.search;
    const limit = this.themeSettingsService.settings.rows;
    this.index = (page * limit) - limit + 1;
    let indexTable= 1;
    this.isLoading = true;
    this.dotThiDanhSachService.getDataByStatusAndSearch(page, dataSearch,date).subscribe({
      next: ({data, recordsTotal}) => {
        this.listData = data.map(m => {
          const timeszone = new Date(m.time_end).getTime() < new Date().getTime();
          m['indexTable']= page ===1 ? indexTable++ : page*10 +indexTable++;
          m['__title_converted'] = `<b>${m.title}</b><br>` + m.desc;
          m['__time_converted'] = this.strToTime(m.time_start) + ' - ' + this.strToTime(m.updated_at);
          m['__bank_coverted'] = this.nganHangDe && m.bank_id && this.nganHangDe.find(f => f.id === m.bank_id) ? this.nganHangDe.find(f => f.id === m.bank_id).title : '';
          m['__status_converted'] = !timeszone ? this.statusOptions[1].color : this.statusOptions[0].color;
          m['total_time'] =  this.nganHangDe.find(f => f.id === m.bank_id) && this.nganHangDe.find(f => f.id === m.bank_id).time_per_test ? this.nganHangDe.find(f => f.id === m.bank_id).time_per_test:0;
          return m;
        })
        this.recordsTotal = recordsTotal;
        this.isLoading = false;
      }, error: () => {
        this.isLoading = false;
        this.notificationService.toastError('Mất kết nối với máy chủ');
      }
    })
  }

  changeInput(text:string){
    this.search = text;
    this._SEARCH_DEBOUNCE.next( text );
  }
  paginate({page}: NgPaginateEvent) {
    this.page = page + 1;
    this.loadData(this.page);
  }

  async handleClickOnTableShiftTest(button: OvicButton) {
    if (!button) {
      return;
    }
    const decision = button.data && this.dataShiftTest ? this.dataShiftTest.find(u => u.thisinh_id === button.data) : null;
    switch (button.name) {
      case 'DETAIL-EXAM':
        const quesition_ids = decision.question_ids;
        const details = decision.details;
        const bank_id = decision['_bank_id'];
        this.notificationService.isProcessing(true);
        this.nganHangCauHoiService.getDataByBankId(bank_id, null).subscribe({
          next: (data) => {
            this.nganhangCauhoi = quesition_ids.map(m => {
              const item = data.find(f => f.id === m)?  data.find(f => f.id === m):null;
              item['__per_select_question'] = details[m] && details[m].join(',').toString() ? details[m].join(',').toString() : '';
              item['__correct_answer_coverted'] =item ? item.correct_answer.map(t => item.answer_options.find(f => f.id === t)):null;
              item['__correct_answer'] = item.correct_answer.join(',');
              return item;
            });
            this.notificationService.isProcessing(false);

          }, error: () => {
            this.notificationService.isProcessing(false);
            this.notificationService.toastError('Load bài làm thất bại');
          }
        })
        break;
      case 'BUTTON_EXPORT_EXCEL':
        const heading = this.dataShiftTest[0]._shift_name;
        const subHeading = this.dataShiftTest[0]._time_loadExam;
        const data = this.dataShiftTest.map((
          {
            index,
            _user_name,
            _sdt_thiSinh,
            _adress_thiSinh,
            _time_loadExam,
            _number_correct_converted,
            score,
          }) => ({
          index,
          _user_name,
          _sdt_thiSinh,
          _adress_thiSinh,
          _time_loadExam,
          _number_correct_converted,
          score,
        }));
        this.exportExcelService.exportAsExcelFile(heading, subHeading, this.columns, data, heading, 'sheet1');
        break;
      default:
        break;
    }
  }



  loadTestTaker(idShift: number, bank_id: number) {
    this.notificationService.isProcessing(true);

    this.dotThiKetQuaService.getDataByShiftIdAndWidth(idShift).pipe(switchMap(project => {
      const ids = project ? project.map(m => m.thisinh_id) : [];
      return forkJoin<[ShiftTests[], NewContestant[]]>([of(project), this.thiSinhService.getDataByShiftest(ids)]);
    })).subscribe({
      next: ([dataShifTest, dataThisinh]) => {
        let i: number = 1;
        const dataUser = dataThisinh.map(m => {
          const shiftTest = dataShifTest.find(f => f.thisinh_id === m.id);
          m['_index'] = i++;
          m['_full_name'] = shiftTest && shiftTest['thisinh'] ? shiftTest['thisinh']['full_name'] : '';
          m['_score'] = shiftTest && shiftTest.score ? this.take_decimal_number(shiftTest.score, 2) : 0;
          m['_time_start_shifttest'] = shiftTest.time_start ? this.getdate(shiftTest.time_start) : '';
          m['_number_correct_converted'] = shiftTest.number_correct + '/' + shiftTest.question_ids.length;
          return m;
        });
        let ind = 1;
        this.dataShiftTest = dataShifTest.map(m => {
          const index = ind++;
          const _shift_name = this.listData.find(f => f.id === m.shift_id).title;
          const _number_correct_converted = m.number_correct + '/' + m.question_ids.length;
          const _score = m.score ? this.take_decimal_number(m.score, 2) : 0;
          const _bank_id = bank_id;
          const _user_name = m['thisinh'] ? m['thisinh']['full_name'] : '';
          let timeDiff = Math.abs(new Date(this.getDateByAmerica(m.updated_at)).getTime() - new Date(this.getDateByAmerica(m.time_start)).getTime());
          let _total_exam_time: string = Math.floor(timeDiff / 60000) + ' phút ' + Math.floor((timeDiff % 60000) / 1000) + ' giây';
          const _time_start_shifttest = m.time_start ? this.getdate(m.time_start) : '';
          const _time_end_shifttest = m.updated_at ? this.getdate(m.updated_at) : '';
          let _time_loadExam: string = _time_start_shifttest + ' - ' + _time_end_shifttest;
          const _sdt_thiSinh = m['thisinh'].phone;
          const _adress_thiSinh = m['thisinh'].address;
          return {
            ...m,
            index,
            _user_name,
            _shift_name,
            _number_correct_converted,
            _bank_id,
            _total_exam_time,
            _time_loadExam,
            _score,
            _time_start_shifttest,
            _time_end_shifttest,
            _sdt_thiSinh,
            _adress_thiSinh
          };
        });
        this.dataUsers = dataUser;
        this.notificationService.isProcessing(false);
      },
      error: () => {
        this.notificationService.isProcessing(false);
        this.notificationService.toastError('Mất kết nối với máy chủ');
      }
    })

  }



  closeForm() {
    this.notificationService.closeSideNavigationMenu();
    this.nganhangCauhoi = null;
  }

  // export excel


  take_decimal_number(num, n) {
    let base = 10 ** n;
    return Math.round(num * base) / base;
  }

  getdate(time: string, getime?: boolean) {
    const date = new Date(time);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Lưu ý rằng tháng bắt đầu từ 0, nên cần cộng thêm 1.
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    if (!getime) {
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } else {
      return `${day}/${month}/${year}`;
    }
  }

  getDateByAmerica(time: string) {
    const date = new Date(time);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Lưu ý rằng tháng bắt đầu từ 0, nên cần cộng thêm 1.
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const secon = String(date.getSeconds()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}:${secon}`;
  }

  btnDataThisinh(item: Shift){
    this.loadTestTaker(item.id, item.bank_id);
    this.notificationService.openSideNavigationMenu({
      name: this.menuName,
      template: this.testTaker,
      size: this.sizeFullWidth,
      offsetTop: '0px'
    });
  }
}
