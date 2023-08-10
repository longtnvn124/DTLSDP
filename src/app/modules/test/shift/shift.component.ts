import {Component, OnInit} from '@angular/core';
import {HelperService} from "@core/services/helper.service";
import {DotThiDanhSachService} from "@shared/services/dot-thi-danh-sach.service";
import {NganHangDeService} from "@shared/services/ngan-hang-de.service";
import {NganHangCauHoiService} from "@shared/services/ngan-hang-cau-hoi.service";
import {Shift} from "@shared/models/quan-ly-doi-thi";
import {NganHangCauHoi, NganHangDe} from "@shared/models/quan-ly-ngan-hang";
import {forkJoin, interval} from "rxjs";
import {NotificationService} from "@core/services/notification.service";
import {logMessages} from "@angular-devkit/build-angular/src/builders/browser-esbuild/esbuild";
import {AuthService} from "@core/services/auth.service";
import {Router} from "@angular/router";
import {ServerTimeService} from "@shared/services/server-time.service";

type ShiftState = -1 | 0 | 1; // o: chưa tới thời gian thi | 1 : trong thời gian cho phép thi | -1 : quá hạn thời gian được phép thi

type ButtonShiftState = { state: ShiftState, label: string, class: string, icon: string };

type ListButtonShiftState = { [T in ShiftState]: ButtonShiftState };

interface DotThiKhaDung extends Shift {
  duration: string;
  totalQuestion: number;
  totalTime: string;
  state: ShiftState;
  button: ButtonShiftState
}

@Component({
  selector: 'app-shift',
  templateUrl: './shift.component.html',
  styleUrls: ['./shift.component.css']
})
export class ShiftComponent implements OnInit {

  private _listButton: ListButtonShiftState = {
    '-1': {state: -1, label: 'Đã quá hạn thời gian', icon: 'pi pi-ban', class: 'p-button-secondary'},
    '0': {state: 0, label: 'Chưa đến giờ thi', icon: 'pi pi-times', class: 'p-button-warning'},
    '1': {state: 1, label: 'Vào thi', icon: 'pi pi-check-square', class: 'p-button-success'},
  }

  userData = this.auth.user;

  dsDotthi: DotThiKhaDung[];

  checkInterval: any;

  constructor(
    private helperService: HelperService,
    private dotThiDanhSachService: DotThiDanhSachService,
    private nganHangDeService: NganHangDeService,
    private nganHangCauHoiService: NganHangCauHoiService,
    private notificationService: NotificationService,
    private auth: AuthService,
    private serverTimeService: ServerTimeService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.loadData();
      this._checkCaThi();
    } else {
      void this.router.navigate(['/login'], {queryParams: {redirect: 'test/shift'}});
    }

  }

  // forkJoin<[QuyetDinhKhenCaNhan[], QuyetDinhKhenCaNhan[]]>([of(res), this.quyetDinhKhenCaNhanService.getQuyetDinhKhenCaNhanByCaNhanIds(ids, this.filter.dhtd_ids)]);
  loadData() {
    this.notificationService.isProcessing(true);
    forkJoin<[Shift[], NganHangDe[]]>([
      this.dotThiDanhSachService.getDotthiByStatusActive(),
      this.nganHangDeService.getDataUnlimit()
    ]).subscribe({
      next: ([dsdotthi, dsNganHangDe]) => {
        this.dsDotthi = dsdotthi.map(m => {
          const nganhang = dsNganHangDe.find(f => f.id === m.bank_id);
          const duration: string = this.strToTime(m.time_start) + ' - ' + this.strToTime(m.time_end);
          const totalQuestion: number = nganhang ? nganhang.number_questions_per_test : 0;
          const totalTime: string = nganhang ? this.timeConvert(nganhang.time_per_test) : '0';
          const state: ShiftState = 0;
          const button: ButtonShiftState = this._listButton[state];
          return {...m, duration, totalQuestion, totalTime, state, button};
        });
        this._checkCaThi();
        this.checkInterval = setInterval(() => this._checkCaThi(), 60000);
        this.notificationService.isProcessing(false);
      },
      error: () => {
        this.notificationService.isProcessing(false);
        this.notificationService.toastError('Mất kết nối với máy chủ');
      }
    })
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

  timeConvert(n) {
    const num = n;
    const minutes = num % 60;
    const rminutes = Math.round(minutes);
    const second = num -rminutes;
    const rsecond = Math.round(second);
    return minutes + "phút, " + rsecond + " giây";
  }

  mode: 'TABLE' | 'EXAM' = "TABLE";

  btnTest(dotthi: DotThiKhaDung) {
    switch (dotthi.state) {
      case -1:
        this.notificationService.toastError('Ca thi đã quá hạn');
        break;
      case 0:
        this.notificationService.toastInfo('Ca thi chưa bắt đầu');
        break;
      case 1:
        // bắt đầu ca thi
        const safeGard = Date.now().toString(10);
        localStorage.setItem('_safeGard', safeGard)
        const code = this.auth.encryptData(JSON.stringify({
          shift_id: dotthi.id,
          bank_id: dotthi.bank_id,
          safeGard
        }));
        void this.router.navigate(['test/panel'], {queryParams: {code}});
        break;
      default:
        this.notificationService.toastError('Ca thi đã quá hạn');
        break;
    }
  }


  private _checkCaThi() {
    this.notificationService.isProcessing(true);
    this.serverTimeService.getTime().subscribe({
      next: (time) => {
        const timeNow = this.helperService.dateFormatWithTimeZone(time.date);
        this.dsDotthi.map(shift => {
          if (shift.state !== -1) {
            const startTime = this.helperService.dateFormatWithTimeZone(shift.time_start);
            const endTime = this.helperService.dateFormatWithTimeZone(shift.time_end);
            if (startTime && startTime) {
              shift.state = (timeNow > endTime) ? -1 : (timeNow < startTime) ? 0 : 1;
            } else {
              shift.state = -1;
            }
            shift.button = this._listButton[shift.state];
          }
          return shift
        });
        if (!this.dsDotthi.filter(u => u.state !== -1).length && this.checkInterval) {
          clearInterval(this.checkInterval);
        }
        this.notificationService.isProcessing(false);
      },
      error: () => {
        this.notificationService.isProcessing(false);
      },
    })
  }


}
