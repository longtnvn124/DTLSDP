import {Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {NotificationService} from '@core/services/notification.service';
import {NganHangCauHoiService} from '@shared/services/ngan-hang-cau-hoi.service';
import {detail, Shift, ShiftTests} from '@shared/models/quan-ly-doi-thi';
import {forkJoin, Observable, of, Subject, switchMap} from 'rxjs';
import {NganHangCauHoi, NganHangDe} from '@shared/models/quan-ly-ngan-hang';
import {NganHangDeService} from '@shared/services/ngan-hang-de.service';
import {DotThiDanhSachService} from '@shared/services/dot-thi-danh-sach.service';
import {DotThiKetQuaService, ShiftTestScore} from '@shared/services/dot-thi-ket-qua.service';
import {DateTimeServer, ServerTimeService} from '@shared/services/server-time.service';
import {HelperService} from '@core/services/helper.service';
import {AuthService} from '@core/services/auth.service';
import {KEY_NAME_CONTESTANT_ID, KEY_NAME_CONTESTANT_PHONE, KEY_NAME_SHIFT_ID} from '@shared/utils/syscat';
import {OvicButton} from '@core/models/buttons';

interface ContestantInfo {
  phone: string,
  testName: string,
  score: string,
  number_correct: number
}

@Component({
  selector: 'app-panel',
  templateUrl: './panel.component.html',
  styleUrls: ['./panel.component.css']
})
export class PanelComponent implements OnInit, OnDestroy {

  @HostListener('window:resize', ['$event']) onResize(): void {
    this.isSmallScreen = window.innerWidth <= 500;
  }

  isSmallScreen: boolean = window.innerWidth <= 500;

  mode: 'PANEL' | 'TEST_RESULT' | 'LOADING' = 'LOADING';

  contestantInfo: ContestantInfo = {
    phone: '',
    testName: '',
    score: '',
    number_correct: 0
  };

  shift: Shift;

  shiftTest: ShiftTests;

  answerQuestions: detail = {};

  enableDialog: boolean = false;

  destroy$: Subject<string> = new Subject<string>();

  questions: NganHangCauHoi[];

  remainingTimeClone: number = 0; // 30 minutes in seconds

  intervalId: any;

  isTimeOver: boolean = false;

  private _validInfo: { shift_id: number, contestant: number } = {shift_id: 0, contestant: 0};

  constructor(
    private router: Router,
    private notificationService: NotificationService,
    private nganHangCauHoiService: NganHangCauHoiService,
    private nganHangDeService: NganHangDeService,
    private shiftService: DotThiDanhSachService,
    private shiftTestsService: DotThiKetQuaService,
    private serverTimeService: ServerTimeService,
    private authService: AuthService,
    private helperService: HelperService
  ) {
  }


  ngOnInit(): void {
    // if ( !this.auth.isLoggedIn() ) {
    // 	void this.router.navigate( [ '/login' ] , { queryParams : { redirect : 'test/panel' } } );
    // } else {
    //
    // }
    //
    // interval( 15000 ).pipe( takeUntil( this.destroy$ ) ).subscribe( () => this.updateTimeLeftToServer() );

    // if ( this.activatedRoute.snapshot.queryParamMap.has( 'code' ) ) {
    // 	const raw  = this.activatedRoute.snapshot.queryParamMap.get( 'code' );
    // 	const s1   = this.auth.decryptData( raw );
    // 	const info = s1 ? JSON.parse( s1 ) : null;
    // 	if ( info ) {
    // 		this.validateInfoFirst( info );
    // 	}
    // } else {
    // 	void this.router.navigate( [ '/test/shift' ] );
    // }
    this.checkInit();
  }

  private updateTimeLeftToServer() {
    if (this.shiftTest && Math.max(this.remainingTimeClone, 0) && this.shiftTest.state === 1) {
      this.shiftTestsService.update(this.shiftTest.id, {state: 1, time: this.remainingTimeClone}).subscribe();
    }
  }

  checkInit() {
    const shift_id: number = this.authService.getOption(KEY_NAME_SHIFT_ID);
    const contestant: number = this.authService.getOption(KEY_NAME_CONTESTANT_ID);
    if (!Number.isNaN(shift_id) && !Number.isNaN(contestant)) {
      this._validInfo.shift_id = shift_id;
      this._validInfo.contestant = contestant;
      this._initTest();
    } else {
      void this.router.navigate(['/test/shift']);
    }
  }

  private _initTest() {
    this.notificationService.isProcessing(true);
    this.contestantInfo.phone = this.authService.getOption(KEY_NAME_CONTESTANT_PHONE);
    this._recheckData(this._validInfo.shift_id, this._validInfo.contestant).subscribe({
      next: ([shiftTest, shift]) => {
        if (shiftTest && shift) {
          this.contestantInfo.testName = shift.title;
          this.shift = shift;
          this.shiftTest = shiftTest;
          this.answerQuestions = this.shiftTest.details || {};
          this.remainingTimeClone = this.shiftTest.time;
          if (this.shiftTest && this.shiftTest.state === 2) {
            this.mode = 'TEST_RESULT';
          } else {
            this.enableDialog = true;
            this.mode = 'PANEL';
          }
        }
        this.notificationService.isProcessing(false);
      },
      error: (e) => {
        console.log(e);
        this.notificationService.isProcessing(false);
        this.notificationService.toastError('Mất kết nối với máy chủ');
      }
    });
  }

  reInitTest() {
    this._initTest();
  }

  take_decimal_number(num, n) {
    //num : số cần xử lý
    //n: số chữ số sau dấu phẩy cần lấy
    let base = 10 ** n;
    return Math.round(num * base) / base;
  }

  private validateShift() {

  }

  private _recheckData(shift_id: number, contestant: number): Observable<[ShiftTests, Shift]> {
    return forkJoin<[Shift, DateTimeServer]>([
      this.shiftService.getDataById(shift_id),
      this.serverTimeService.getTime()
    ]).pipe(switchMap(([shift, dateTime]): Observable<[ShiftTests, Shift]> => {
      const currentTime: Date = this.helperService.dateFormatWithTimeZone(dateTime.date);
      const startTime: Date = this.helperService.dateFormatWithTimeZone(shift.time_start);
      const expiredTime: Date = this.helperService.dateFormatWithTimeZone(shift.time_end);
      return this.helperService.isBeforeDate(currentTime, expiredTime) && this.helperService.isAfterDate(currentTime, startTime) ? forkJoin<[ShiftTests, Shift]>([
        this._getContestantShiftTest(shift, contestant),
        of(shift)
      ]) : of([null, null]);
    }));
  }

  private _getContestantShiftTest(shift: Shift, contestant: number): Observable<ShiftTests> {
    return this.shiftTestsService.getShiftTest(shift.id, contestant).pipe(switchMap(shiftTest => shiftTest ? of(shiftTest) : this.createNewShiftTest(shift, contestant)));
  }

  private createNewShiftTest(shift: Shift, contestant: number): Observable<ShiftTests> {
    return forkJoin<[NganHangDe, NganHangCauHoi[], DateTimeServer]>([
      this.nganHangDeService.getDataById(shift.bank_id),
      this.nganHangCauHoiService.getDataByBankId(shift.bank_id, null, 'id'),
      this.serverTimeService.getTime()
    ]).pipe(switchMap(([nganHangDe, questions, dateTime]) => {
      return this.shiftTestsService.createShiftTest({
        shift_id: shift.id,
        thisinh_id: contestant,
        question_ids: this.randomQuestions(questions.map(u => u.id), nganHangDe.number_questions_per_test),
        time_start: this.helperService.formatSQLDateTime(this.helperService.dateFormatWithTimeZone(dateTime.date)),
        time: Math.max(nganHangDe.time_per_test, 1) * 60
      }).pipe(switchMap(id => this.shiftTestsService.getShiftTestById(id)));
    }));
  }

  startTimer(remainingTime: number): void {
    this.intervalId = setInterval(() => {
      if (remainingTime > 0) {
        remainingTime--;
        this.remainingTimeClone = remainingTime;
      } else {
        this.stopTimer();
        this.viewSubmitTimeisOver();
      }
    }, 1000);
  }

  getFormattedTime(): string {
    const minutes: number = Math.floor(this.remainingTimeClone / 60);
    const seconds: number = this.remainingTimeClone % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  stopTimer(): void {
    clearInterval(this.intervalId);
  }

  randomQuestions(questions: number[], length: number): number[] {
    const shuffledArray = questions.sort(() => Math.random() - 0.5);
    shuffledArray.length = Math.min(length, shuffledArray.length);
    return shuffledArray;
  }

  startTheTest() {
    this.enableDialog = false;
    this.loadQuestion();
    this.startTimer(this.shiftTest.time);
  }

  loadQuestion() {
    this.notificationService.isProcessing(true);
    this.nganHangCauHoiService.getTestQuestions(this.shiftTest.question_ids, 'id,bank_id,title,answer_options').subscribe({
      next: (questions) => {
        this.shiftTest.state = 1;
        this.questions = questions.map(item => {
          const answered = this.answerQuestions[item.id];
          item['__answered'] = answered && Array.isArray(answered) ? answered.filter(Boolean).join() : '';
          return item;
        });
        this.notificationService.isProcessing(false);
      },
      error: (e) => {
        this.notificationService.isProcessing(false);
        this.notificationService.toastError('Mất kết nối với máy chủ');
      }
    });
  }

  async btSubmit() {
    if (Object.keys(this.answerQuestions).length < this.shiftTest.question_ids.length) {
      this.notificationService.toastWarning('Bạn chưa điềm đủ đáp án');
    } else {
      const headText: string = 'Thông báo';
      this.stopTimer();
      const confirm: OvicButton = await this.notificationService.confirmRounded(`<p class="text-danger">Xác nhận nộp bài</p>`, headText);
      if (confirm.name === 'yes') {
        this.serverTimeService.getTime().pipe(switchMap((time) => {
          return this.shiftTestsService.update(this.shiftTest.id, {
            state: 2,
            time_end: this.helperService.formatSQLDateTime(this.helperService.dateFormatWithTimeZone(time.date)),
            details: this.answerQuestions
          }).pipe(switchMap(() => this.shiftTestsService.scoreTest(this.shiftTest.id)));
        })).subscribe({
          next: (result: ShiftTestScore) => {
            this.shiftTest.state = 2;
            this.shiftTest.details = this.answerQuestions;
            this.notificationService.isProcessing(false);
            this.contestantInfo.number_correct = result.number_correct;
            this.contestantInfo.score = result.score.toFixed(2);
            this.mode = 'TEST_RESULT';
          }, error: () => {
            this.notificationService.isProcessing(false);
            this.notificationService.toastWarning('Nộp bài thất bại');
          }
        });
      } else {
        this.startTimer(this.remainingTimeClone);
      }
    }
  };

  selectQuestion(id: number, value: string) {
    if (id && value) {
      this.answerQuestions[id] = value.split(',').map(m => parseInt(m));
      this.shiftTestsService.update(this.shiftTest.id, {
        details: this.answerQuestions,
        time: this.remainingTimeClone
      }).subscribe();
    } else {
      delete this.answerQuestions[id];
      this.shiftTestsService.update(this.shiftTest.id, {
        details: this.answerQuestions,
        time: this.remainingTimeClone
      }).subscribe();
    }
  }

  viewSubmitTimeisOver() {
    this.isTimeOver = true;
  }

  submitTheTest(): void {
    this.notificationService.isProcessing(true);
    this.shiftTestsService.update(this.shiftTest.id, {
      state: 2,
      details: this.answerQuestions,
      time: 0
    }).pipe(switchMap((time) => this.shiftTestsService.scoreTest(this.shiftTest.id))).subscribe({
      next: (result: ShiftTestScore) => {
        this.notificationService.isProcessing(false);
        this.shiftTestsService.scoreTest(this.shiftTest.id).subscribe();
        this.notificationService.toastSuccess('Nộp bài thành công');
        // this.reInitTest();
        this.contestantInfo.number_correct = result.number_correct;
        this.contestantInfo.score = result.score.toFixed(2);
        this.isTimeOver = false;
        this.mode = 'TEST_RESULT';
      },
      error: () => {
        this.notificationService.isProcessing(false);
        this.notificationService.toastError('Nộp bài thất bại');
      }
    });
  }

  btnOutTest() {
    this.authService.setOption(KEY_NAME_CONTESTANT_ID, 0);
    this.authService.setOption(KEY_NAME_SHIFT_ID, 0);
    this.authService.setOption(KEY_NAME_CONTESTANT_PHONE, '');
    void this.router.navigate(['/test/shift']);
  }

  saveTheTest() {
    this.shiftTestsService.update(this.shiftTest.id, {
      details: this.answerQuestions,
      time: this.remainingTimeClone
    }).subscribe(() => this.notificationService.toastSuccess('Hệ thống đã lưu bài làm ở thời điểm hiện tại'));
  }


  ngOnDestroy(): void {
    this.stopTimer();
    const time = this.remainingTimeClone;
    const questionIds = this.answerQuestions;
    if (time && questionIds && this.router.navigate(['/test/shift'])) {
      this.shiftTestsService.update(this.shiftTest.id, {time: time, details: questionIds}).subscribe();
    } else {
      this.shiftTestsService.update(this.shiftTest.id, {time: time, details: questionIds, state: -1}).subscribe();
    }
    this.destroy$.next('closed');
    this.destroy$.complete();
  }


}
