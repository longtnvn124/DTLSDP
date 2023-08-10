import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {FormBuilder} from "@angular/forms";
import {filter, forkJoin, of, Subscription, switchMap} from "rxjs";

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

interface DataShiftTest extends ShiftTests{
  index:number,
  _shift_name:string,
  _number_correct_converted:string,
  _bank_id:number,
  _user_name:string,
  _total_exam_time:string,
  _time_loadExam:string
}
@Component({
  selector: 'app-dot-thi-thi-sinh',
  templateUrl: './dot-thi-thi-sinh.component.html',
  styleUrls: ['./dot-thi-thi-sinh.component.css']
})
export class DotThiThiSinhComponent implements OnInit {

  @ViewChild('testTaker', {static: true}) testTaker: TemplateRef<any>;
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
  statusOptions= statusOptions;
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

  tblStructureShiftTest:OvicTableStructure[] = [
    {
      fieldType: 'normal',
      field: ['_user_name'],
      innerData: true,
      header: 'Tên thí sinh',
      sortable: false,
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
      field: ['score'],
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

  tblStructure: OvicTableStructure[] = [
    {
      fieldType: 'normal',
      field: ['__title_converted'],
      innerData: true,
      header: 'Tên đợt thi',
      sortable: false,
    },
    {
      fieldType: 'normal',
      field: ['__time_converted'],
      innerData: true,
      header: 'Thời gian thi',
      sortable: false,
      headClass: 'ovic-w-300px text-center',
      rowClass: 'ovic-w-300px text-center'
    },
    {
      fieldType: 'normal',
      field: ['__bank_coverted'],
      innerData: true,
      header: 'Ngân hàng đề sử dụng',
      sortable: false,
      headClass: 'ovic-w-180px text-center',
      rowClass: 'ovic-w-180px text-center'
    },
    {
      fieldType: 'normal',
      field: ['__status_converted'],
      innerData: true,
      header: 'Trạng thái',
      sortable: false,
      headClass: 'ovic-w-120px text-center',
      rowClass: 'ovic-w-120px text-center'
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
          tooltip: 'Danh sách thí sinh',
          label: '',
          icon: 'pi pi-users',
          name: 'TEST-TAKER',
          cssClass: 'btn-warning rounded'
        },

      ]
    }
  ];


  constructor(
    private dotThiDanhSachService: DotThiDanhSachService,
    private notificationService: NotificationService,
    private fb: FormBuilder,
    private themeSettingsService: ThemeSettingsService,
    private nganHangDeService: NganHangDeService,
    private helperService: HelperService,
    private nganHangCauHoiService:NganHangCauHoiService,
    private dotThiKetQuaService:DotThiKetQuaService,
    private exportExcelService:ExportExcelService,
  ) {
    const observeProcessCloseForm = this.notificationService.onSideNavigationMenuClosed().pipe(filter(menuName => menuName === this.menuName && this.needUpdate)).subscribe(() => this.loadData(this.page));
    this.subscription.add(observeProcessCloseForm);
    const observerOnResize = this.notificationService.observeScreenSize.subscribe(size => this.sizeFullWidth = size.width)
    this.subscription.add(observerOnResize);
  }
  nganHangDe:NganHangDe[];
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

  private convertDateFormat(dateString: string): string {
    const date = new Date(dateString);
    return date ? this.helperService.formatSQLDateTime(date) : null;
  }

  loadData(page) {
    const limit = this.themeSettingsService.settings.rows;
    this.index = (page * limit) - limit + 1;
    this.isLoading = true;
    this.dotThiDanhSachService.load(page, this.search).subscribe({
      next: ({data, recordsTotal}) => {
        this.listData = data.map(m => {
          m['__title_converted'] = `<b>${m.title}</b><br>` + m.desc;
          m['__time_converted'] = this.strToTime(m.time_start) + ' - ' + this.strToTime(m.time_end);
          m['__bank_coverted'] = this.nganHangDe && m.bank_id && this.nganHangDe.find(f=>f.id=== m.bank_id) ? this.nganHangDe.find(f=>f.id=== m.bank_id).title : '';
          m['__status_converted'] = m.status ===1 ? this.statusOptions[1].color : this.statusOptions[0].color;
          m['total_time'] = this.nganHangDe.find(f=>f.id === m.bank_id).time_per_test;
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
    const decision = button.data && this.listData ? this.listData.find(u => u.id === button.data) : null;
    switch (button.name) {
      case 'TEST-TAKER':
        console.log(decision);
        this.loadTestTaker(decision.id, decision.bank_id,decision);
        this.notificationService.openSideNavigationMenu({
          name:this.menuName,
          template: this.testTaker,
          size: this.sizeFullWidth,
          offsetTop: '0px'
        });
        break;

      default:
        break;
    }
  }
  nganhangCauhoi:NganHangCauHoi[];

  async handleClickOnTableShiftTest(button: OvicButton) {
    if (!button) {
      return;
    }
    const decision = button.data && this.dataShiftTest ? this.dataShiftTest.find(u => u.id === button.data) : null;
    switch (button.name) {
      case 'DETAIL-EXAM':
        const quesition_ids = decision.question_ids;
        const details = decision.details;
        const bank_id = decision['_bank_id'];
        this.notificationService.isProcessing(true);
        this.nganHangCauHoiService.getDataByBankId(bank_id,null).subscribe({
          next:(data)=>{
            this.nganhangCauhoi= quesition_ids.map(m =>{
              const item =data.find(f=>f.id === m);
              item['per_select_question'] = details[m].join(',').toString();
              item['correct_answer_coverted'] = item.correct_answer.map(t=> item.answer_options.find(f=>f.id === t).value);
              return item;
            });
            console.log(this.nganhangCauhoi);
            this.notificationService.isProcessing(false);
          },error:()=>{
            this.notificationService.isProcessing(false);
            this.notificationService.toastError('Load bài làm thất bại');
          }
        })
        break;
      case 'BUTTON_EXPORT_EXCEL':
        const heading  = this.dataShiftTest[0]._shift_name;
        const subHeading = this.dataShiftTest[0]._time_loadExam;
        const data = this.dataShiftTest.map(({index,_user_name,_number_correct_converted,score,_total_exam_time})=>({index,_user_name,_number_correct_converted,score,_total_exam_time}));
        console.log(data);
        this.exportExcelService.exportAsExcelFile(heading,subHeading,this.columns,data,heading,'sheet1');
        break;
      default:
        break;
    }
  }
    // {"2":[3],"4":[1],"6":[3],"7":[2],"8":[2,3]}
  shiftTest:ShiftTests[];

  loadTestTaker(idShift:number, bank_id:number,shift:Shift){
    this.notificationService.isProcessing(true);
    this.dotThiKetQuaService.getDataByShiftId(idShift).subscribe({
      next:(data)=>{
        let i :number=1;
        this.dataShiftTest = data.map(m=>{
          const index = i++;
          const _shift_name = this.listData.find(f=>f.id ===m.shift_id).title;
          const _number_correct_converted = m.number_correct +'/'+m.question_ids.length;
          const  _bank_id= bank_id;
          const _user_name = m['users']['display_name'];
          const _total_exam_time = (shift['total_time']*60 - m.time)%60 +' phút ' +(shift['total_time']-(shift['total_time'] - m.time)%60) +' giây';
          const _time_loadExam = this.listData.find(f=>f.id === m.shift_id)['__time_converted'];
          return {... m,index,_shift_name,_number_correct_converted,_bank_id,_user_name,_total_exam_time,_time_loadExam};
        });
        console.log(this.dataShiftTest)
        this.notificationService.isProcessing(false);
      },error:()=>{
        this.notificationService.isProcessing(false);
        this.notificationService.toastError('Mất kết nối với máy chủ');
      }
    })

  }

  dataShiftTest:DataShiftTest[];

  closeForm(){
    this.notificationService.closeSideNavigationMenu();
  }
  // export excel
  columns = [
    'Stt','Tên thi sinh','Số câu trả lời đúng', 'Điểm','Thời gian làm bài'
  ]

}
