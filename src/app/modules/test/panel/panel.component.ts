import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {NotificationService} from "@core/services/notification.service";
import {NganHangCauHoiService} from "@shared/services/ngan-hang-cau-hoi.service";
import {detail, Shift, ShiftTests} from "@shared/models/quan-ly-doi-thi";
import {AuthService} from "@core/services/auth.service";
import {forkJoin, Observable, of, switchMap} from "rxjs";
import {NganHangCauHoi, NganHangDe} from "@shared/models/quan-ly-ngan-hang";
import {NganHangDeService} from "@shared/services/ngan-hang-de.service";
import {DotThiDanhSachService} from "@shared/services/dot-thi-danh-sach.service";
import {DotThiKetQuaService} from "@shared/services/dot-thi-ket-qua.service";
import {environment} from "@env";
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {map} from "rxjs/operators";
import {DateTimeServer, ServerTimeService} from "@shared/services/server-time.service";
import {HelperService} from "@core/services/helper.service";

// interface DotThiKhaDung extends shift {
//   duration: string;
//   totalQuestion: number;
//   totalTime: string;
//   state: ShiftState;
//   button: ButtonShiftState
// }

type TestState = 0 | 1 | 2 | -1; //0:Chưa Thi | 1: Đang thi| 2:Đã nộp bài |-1 bỏ thi;
interface answer_options {
  id: number,
  value: string
};

@Component({
  selector: 'app-panel',
  templateUrl: './panel.component.html',
  styleUrls: ['./panel.component.css']
})
export class PanelComponent implements OnInit {

  mode: 'PANEL' | 'TEST' = 'PANEL';
  candiate = {
    name: 'Unknown',
    avatar: '',
    testName: '',
    date: ''
  };

  nganHangDe: NganHangDe;
  shift: Shift;
  shiftTest: ShiftTests;
  enableDialog: boolean = false;

  private _validateInfo = {
    shift_id: 0,
    bank_id: 0,
    safeGard: 0,
  }
  formSave: FormGroup;

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
    private fb: FormBuilder
  ) {
    this.formSave = this.fb.group({
      detail: [[], Validators.required],
    })
  }

  anwserQuestions: detail = {};

  get f(): { [key: string]: AbstractControl<any> } {
    return this.formSave.controls;
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
  }

  validateInfo(info: { shift_id: string, bank_id: string, safeGard: string }) {
    const shift_id: number = info.shift_id ? parseInt(info.shift_id, 10) : NaN;
    const bank_id: number = info.bank_id ? parseInt(info.bank_id, 10) : NaN;
    const safeGard: number = info.safeGard ? parseInt(info.safeGard, 10) : NaN;
    const checkSafeGard = environment.production ? !Number.isNaN(safeGard) && (Date.now() - safeGard ! < 300) : true;
    if (!Number.isNaN(shift_id) && !Number.isNaN(bank_id) && checkSafeGard) {
      console.log('passed validate');
      this._validateInfo = {shift_id, bank_id, safeGard}
      this._initTest();
    } else {
      console.log('redirect /test/shift');
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
        const d = new Date();
        this.candiate = {
          name: this.auth.user.display_name,
          avatar: this.auth.user.avatar,
          testName: this.shift.title,
          date: [d.getDate().toString().padStart(2, '0'), (d.getMonth() + 1).toString().padStart(2, '0'), d.getFullYear().toString()].join('/')
        }
        this.notificationService.isProcessing(false);
        this.enableDialog = true;
      },
      error: (e) => {
        console.log(e)
        this.notificationService.isProcessing(false);
        this.notificationService.toastError('Mất kết nối với máy chủ');
      }
    })
  }


  reInitTest() {
    this._initTest();
  }

  // getUserShiftTest(bank: NganHangDe, shift: Shift, questions: NganHangCauHoi[]): Observable<[NganHangDe, Shift, ShiftTests]> {
  //   return this.dotThiKetQuaService.getShiftTest(shift.id, this.auth.user.id).pipe(switchMap(shiftTest => shiftTest ? of([]) :))
  // }

  private convertDateFormat(dateString: string): string {
    const date = new Date(dateString);
    return date ? this.helperService.formatSQLDateTime(date) : null;
  }


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
        // time_start: this.helperService.formatSQLDate(this.helperService.dateFormatWithTimeZone(dateTime.date)),
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

        // /this.anwserQuestion['this.remainingTimeClone'] = this.f['detail'].value;
        // console.log(this.anwserQuestion)/;
        // console.log(this.formSave.value);
      } else {
        this.stopTimer();
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

  ramdomQuestionBank(array: NganHangCauHoi[], total: number) {
    const shuffledArray = [...array]; // Tạo một bản sao của mảng để không làm thay đổi mảng gốc
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    if (total > shuffledArray.length) {
      return shuffledArray;
    }
    return shuffledArray.slice(0, total);
  }

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
    forkJoin<[ShiftTests, NganHangCauHoi[]]>([
      this.dotThiKetQuaService.update(this.shiftTest.id, {state: 1}),
      this.nganHangCauHoiService.getDataByBankId(this._validateInfo.bank_id, null, 'id,bank_id,title,answer_options')])
      .subscribe({
        next: ([shiftTest, dataQuestion]) => {
          this.shiftTest.state = 1;
          const question_ids = this.shiftTest.question_ids;
          console.log(question_ids);
          this.dataQuestion = question_ids.map(id => {
            const item = dataQuestion.find(f => f.id === id)
            return item;
          })
          console.log(this.dataQuestion);

          this.notificationService.isProcessing(false)

        }, error: (e) => {
          this.notificationService.isProcessing(false)
          this.notificationService.toastError("Mất kết nối với máy chủ");
        }
      })
  }

  a: number = 1;

  btSubmit() {
    this.a++

    this.anwserQuestions[this.a] = this.f['detail'].value;
    console.log(this.anwserQuestions);
  };



}
