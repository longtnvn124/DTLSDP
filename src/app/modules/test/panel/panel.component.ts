import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {NotificationService} from "@core/services/notification.service";
import {NganHangCauHoiService} from "@shared/services/ngan-hang-cau-hoi.service";
import {detail, Shift, ShiftTests} from "@shared/models/quan-ly-doi-thi";
import {AuthService} from "@core/services/auth.service";
import {forkJoin, interval, Observable, of, Subject, switchMap, takeUntil} from "rxjs";
import {NganHangCauHoi, NganHangDe} from "@shared/models/quan-ly-ngan-hang";
import {NganHangDeService} from "@shared/services/ngan-hang-de.service";
import {DotThiDanhSachService} from "@shared/services/dot-thi-danh-sach.service";
import {DotThiKetQuaService} from "@shared/services/dot-thi-ket-qua.service";
import {environment} from "@env";
import {DateTimeServer, ServerTimeService} from "@shared/services/server-time.service";
import {HelperService} from "@core/services/helper.service";

@Component({
  selector: 'app-panel',
  templateUrl: './panel.component.html',
  styleUrls: ['./panel.component.css']
})
export class PanelComponent implements OnInit, OnDestroy {

  mode: 'PANEL' | 'TEXTRESULTS';
  candiate = {
    name: 'Unknown',
    avatar: '',
    testName: '',
    date: '',
    number_correct:'',
    result:0,
  };

  shift: Shift;
  shiftTest: ShiftTests;
  anwserQuestions: detail = {};
  enableDialog: boolean = false;
  private _validateInfo = {
    shift_id: 0,
    bank_id: 0,
    safeGard: 0,
  }

  b: number = 1;
  destroy$ = new Subject<string>();

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private notificationService: NotificationService,
    private nganHangCauHoiService: NganHangCauHoiService,
    private nganHangDeService: NganHangDeService,
    private auth: AuthService,
    private dotThiDanhSachService: DotThiDanhSachService,
    private dotThiKetQuaService: DotThiKetQuaService,
    private serverTimeService: ServerTimeService,
    private helperService: HelperService,
  ) {

  }


  ngOnDestroy(): void {
    this.stopTimer();
    const time = this.remainingTimeClone;
    const questionIds = this.anwserQuestions;
    if (time && questionIds && this.router.navigate(['/test/shift'])) {
      this.dotThiKetQuaService.update(this.shiftTest.id, {time: time, details: questionIds}).subscribe();
    }else{
      this.dotThiKetQuaService.update(this.shiftTest.id, {time: time, details: questionIds,state:-1}).subscribe();
    }
    this.destroy$.next('closed');
    this.destroy$.complete()





  }

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      void this.router.navigate(['/login'], {queryParams: {redirect: 'test/panel'}});
    } else {
      if (this.activatedRoute.snapshot.queryParamMap.has('code')) {
        const raw = this.activatedRoute.snapshot.queryParamMap.get('code');
        const s1 = this.auth.decryptData(raw);
        const info = s1 ? JSON.parse(s1) : null;
        this.validateInfo(info);
      } else {
        void this.router.navigate(['/test/shift']);
      }
    }

    interval(15000).pipe(takeUntil(this.destroy$)).subscribe(() => this.updateTimeLeftToServer());
  }


  private updateTimeLeftToServer() {
    if (this.shiftTest && Math.max(this.remainingTimeClone, 0) && this.shiftTest.state === 1) {
      this.dotThiKetQuaService.update(this.shiftTest.id, {time: this.remainingTimeClone}).subscribe();
    }
  }

  validateInfo(info: { shift_id: string, bank_id: string, safeGard: string }) {
    const shift_id: number = info.shift_id ? parseInt(info.shift_id, 10) : NaN;
    const bank_id: number = info.bank_id ? parseInt(info.bank_id, 10) : NaN;
    const safeGard: number = info.safeGard ? parseInt(info.safeGard, 10) : NaN;
    const checkSafeGard = environment.production ? !Number.isNaN(safeGard) && (Date.now() - safeGard ! < 300) : true;
    if (!Number.isNaN(shift_id) && !Number.isNaN(bank_id) && checkSafeGard) {
      this._validateInfo = {shift_id, bank_id, safeGard}
      this._initTest();
    } else {
      void this.router.navigate(['/test/shift']);
    }
  }

  private _initTest() {
    const user_id: number = this.auth.user.id;
    this.notificationService.isProcessing(true);
    this.getData(this._validateInfo.shift_id, user_id, this._validateInfo.bank_id).subscribe({
      next: ([shift_test, shift]) => {
        this.shift = shift;
        this.shiftTest = shift_test;
        this.anwserQuestions = this.shiftTest.details || {};
        this.remainingTimeClone = this.shiftTest.time;
        const d = new Date();
        if (this.shiftTest && this.shiftTest.state === 2) {
          if(this.shiftTest ){
            this.candiate={
              name: this.auth.user.display_name,
              avatar: this.auth.user.avatar,
              testName: this.shift.title,
              date: [d.getDate().toString().padStart(2, '0'), (d.getMonth() + 1).toString().padStart(2, '0'), d.getFullYear().toString()].join('/'),
              number_correct:this.shiftTest.number_correct +'/'+ this.shiftTest.question_ids.length,
              result: this.shiftTest.score,
            }
          }
          this.mode = "TEXTRESULTS";
        } else {
          this.candiate = {
            name: this.auth.user.display_name,
            avatar: this.auth.user.avatar,
            testName: this.shift.title,
            date: [d.getDate().toString().padStart(2, '0'), (d.getMonth() + 1).toString().padStart(2, '0'), d.getFullYear().toString()].join('/'),
            number_correct:'',
            result: 0,
          }
          this.enableDialog = true;
          this.mode = "PANEL";

        }
        this.notificationService.isProcessing(false);

      },
      error: (e) => {

        this.notificationService.isProcessing(false);
        this.notificationService.toastError('Mất kết nối với máy chủ');
      }
    })
  }


  reInitTest() {
    this._initTest();
  }

  // private convertDateFormat(dateString: string): string {
  //   const date = new Date(dateString);
  //   return date ? this.helperService.formatSQLDateTime(date) : null;
  // }

  private getData(shift_id: number, user_id: number, bank_id: number): Observable<[ShiftTests, Shift]> {
    return this.dotThiKetQuaService.getShiftTest(shift_id, this.auth.user.id).pipe(switchMap(shiftTest => shiftTest ? forkJoin<[ShiftTests, Shift]>([
      of(shiftTest),
      this.dotThiDanhSachService.getDataById(shift_id)
    ]) : this.createNewShiftTest(shift_id, user_id, bank_id)))
  }

  private createNewShiftTest(shift_id: number, user_id: number, bank_id: number): Observable<[ShiftTests, Shift]> {
    return forkJoin<[NganHangDe, NganHangCauHoi[], Shift, DateTimeServer]>([
      this.nganHangDeService.getDataById(bank_id),
      this.nganHangCauHoiService.getDataByBankId(bank_id, null, 'id'),
      this.dotThiDanhSachService.getDataById(shift_id),
      this.serverTimeService.getTime()
    ]).pipe(switchMap(([nganHangDe, questions, shift, dateTime]) => {
      return this.dotThiKetQuaService.createShiftTest({
        shift_id: shift_id,
        user_id: user_id,
        question_ids: this.randomQuestions(questions.map(u => u.id), nganHangDe.number_questions_per_test),
        time_start: this.helperService.formatSQLDateTime(this.helperService.dateFormatWithTimeZone(dateTime.date)),
        time: Math.max(nganHangDe.time_per_test, 1) * 60
      }).pipe(switchMap(id => forkJoin<[ShiftTests, Shift]>([
        this.dotThiKetQuaService.getShiftTestById(id),
        of(shift)
      ])))
    }));
  }

  remainingTimeClone: number = 0; // 30 minutes in seconds
  intervalId: any;

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
    const minutes = Math.floor(this.remainingTimeClone / 60);
    const seconds = this.remainingTimeClone % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  stopTimer(): void {
    clearInterval(this.intervalId);
  }

  // ramdomQuestionBank(array: NganHangCauHoi[], total: number) {
  //   const shuffledArray = [...array]; // Tạo một bản sao của mảng để không làm thay đổi mảng gốc
  //   for (let i = shuffledArray.length - 1; i > 0; i--) {
  //     const j = Math.floor(Math.random() * (i + 1));
  //     [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  //   }
  //   if (total > shuffledArray.length) {
  //     return shuffledArray;
  //   }
  //   return shuffledArray.slice(0, total);
  // }

  randomQuestions(questions: number[], length: number): number[] {
    const shuffledArray = questions.sort(() => Math.random() - 0.5);
    shuffledArray.length = Math.min(length, shuffledArray.length);
    return shuffledArray;
  }

  startTheTest() {
    this.enableDialog = false;
    // load questuion by ids from shiftTest.questions_ids
    this.loadQuestion();
    this.startTimer(this.shiftTest.time)

  }

  dataQuestion: NganHangCauHoi[];

  loadQuestion() {
    this.notificationService.isProcessing(true);
    this.nganHangCauHoiService.getDataByBankId(this._validateInfo.bank_id, null, 'id,bank_id,title,answer_options').subscribe({
      next: (dataQuestion) => {
        this.shiftTest.state = 1;
        // const question_ids = this.shiftTest.question_ids;
        this.dataQuestion = this.shiftTest.question_ids.map(id => {
          const item = dataQuestion.find(f => f.id === id);
          if (this.anwserQuestions !== {}) {
            const detail: number[] = this.anwserQuestions[id];
            item['answer_per_select'] = detail ? detail.join(',') : null;

          } else {
            item['answer_per_select'] = null;
          }

          return item;
        })

        this.notificationService.isProcessing(false)
      }, error: (e) => {
        this.notificationService.isProcessing(false)
        this.notificationService.toastError("Mất kết nối với máy chủ");
      }
    })
  }

  a: number = 1;

  async btSubmit() {
    if (Object.keys(this.anwserQuestions).length < this.shiftTest.question_ids.length) {
      this.notificationService.toastWarning('Bạn chưa điềm đủ đáp án');

    } else {
      const headText = 'Thông báo';
      this.stopTimer();
      const confirm = await this.notificationService.confirmRounded(`<p class="text-danger">Xác nhận nộp bài</p>`, headText);
      if (confirm.name === 'yes') {
        this.serverTimeService.getTime().pipe(switchMap((time) => {
          const timeconverted = this.helperService.formatSQLDateTime(this.helperService.dateFormatWithTimeZone(time.date));
          return this.dotThiKetQuaService.update(this.shiftTest.id, {
            state: 2,
            time_end: timeconverted,
            details: this.anwserQuestions
          }).pipe(switchMap(()=> this.dotThiKetQuaService.scoreTest(this.shiftTest.id)));
        })).subscribe({
          next: () => {
            this.shiftTest.state = 2;
            this.shiftTest.details = this.anwserQuestions;
            this.notificationService.isProcessing(false);
            this.reInitTest();
          }, error: () => {
            this.notificationService.isProcessing(false);
            this.notificationService.toastWarning('Nộp bài thất bại');
          }
        })
      } else {
        this.startTimer(this.remainingTimeClone);
      }


    }
  };

  selectQuestion(id: number, value: string) {
    if (id && value) {
      this.anwserQuestions[id] = value.split(',').map(m => parseInt(m));

      this.dotThiKetQuaService.update(this.shiftTest.id, {
        details: this.anwserQuestions,
        time: this.remainingTimeClone
      }).subscribe();
    } else {
      delete this.anwserQuestions[id];
      this.dotThiKetQuaService.update(this.shiftTest.id, {
        details: this.anwserQuestions,
        time: this.remainingTimeClone
      }).subscribe();
    }
  }

  isTimeOver: boolean = false;

  viewSubmitTimeisOver() {
    this.isTimeOver = true;
  }

  async submitTimeisOver() {
    this.notificationService.isProcessing(true);
    this.serverTimeService.getTime().pipe(switchMap((time) => {
      const timeconverted = this.helperService.formatSQLDateTime(this.helperService.dateFormatWithTimeZone(time.date));
      return this.dotThiKetQuaService.update(this.shiftTest.id, {
        state: 2,
        time_end: timeconverted,
        details: this.anwserQuestions,
        time: 0,
      });
    })).subscribe({
      next: () => {
        this.mode = "TEXTRESULTS";
        this.dotThiKetQuaService.scoreTest(this.shiftTest.id).subscribe();
        this.notificationService.isProcessing(false);
        this.notificationService.toastSuccess("Nộp bài thành công");
        this.reInitTest()
      },
      error: () => {
        this.notificationService.isProcessing(false);
        this.notificationService.toastError('Nộp bài thất bại');
      }
    })
  }

  btnOutTest() {
    void this.router.navigate(['/test/shift']);
  }

  saveTheTest() {
    this.dotThiKetQuaService.update(this.shiftTest.id, {
      details: this.anwserQuestions,
      time: this.remainingTimeClone
    }).subscribe(
      {
        next: () =>
          this.notificationService.toastSuccess('Hệ thống đã lưu bài làm ở thời điểm hiện tại')
      }
    );
  }

}
