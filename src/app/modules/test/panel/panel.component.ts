import { Component , HostListener , OnDestroy , OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '@core/services/notification.service';
import { NganHangCauHoiService } from '@shared/services/ngan-hang-cau-hoi.service';
import { Shift , ShiftTests } from '@shared/models/quan-ly-doi-thi';
import { forkJoin , interval , merge , Observable , of , Subject , switchMap , takeUntil } from 'rxjs';
import { NganHangCauHoi , NganHangDe } from '@shared/models/quan-ly-ngan-hang';
import { NganHangDeService } from '@shared/services/ngan-hang-de.service';
import { DotThiDanhSachService } from '@shared/services/dot-thi-danh-sach.service';
import { DotThiKetQuaService , ShiftTestScore } from '@shared/services/dot-thi-ket-qua.service';
import { DateTimeServer , ServerTimeService } from '@shared/services/server-time.service';
import { HelperService } from '@core/services/helper.service';
import { AuthService } from '@core/services/auth.service';
import { KEY_NAME_CONTESTANT_ID , KEY_NAME_CONTESTANT_PHONE , KEY_NAME_SHIFT_ID } from '@shared/utils/syscat';
import { OvicButton } from '@core/models/buttons';
import { catchError } from 'rxjs/operators';

interface ContestantInfo {
  phone : string;
  testName : string;
  score : string;
  number_correct : number;
  strokeDasharray : string;
  totalQuestion : number;
  answered : number;
  percentage_correct?:string;

}

type ClientAnswer = { [ T : number ] : number[] };

@Component( {
  selector    : 'app-panel' ,
  templateUrl : './panel.component.html' ,
  styleUrls   : [ './panel.component.css' ]
} )
export class PanelComponent implements OnInit , OnDestroy {

  @HostListener( 'window:resize' , [ '$event' ] ) onResize() : void {
    this.isSmallScreen = window.innerWidth <= 500;
  }

  isSmallScreen : boolean = window.innerWidth <= 500;

  mode : 'PANEL' | 'TEST_RESULT' | 'LOADING' = 'LOADING';

  contestantInfo : ContestantInfo = {
    phone           : '' ,
    testName        : '' ,
    score           : '' ,
    number_correct  : 0 ,
    strokeDasharray : '0 200' ,
    totalQuestion   : 0 ,
    answered        : 0
  };

  shift : Shift;

  shiftTest : ShiftTests;

  answerQuestions : ClientAnswer = {};

  openStartTheTestDialog : boolean = false;

  destroy$ : Subject<string> = new Subject<string>();

  questions : NganHangCauHoi[];

  remainingTimeClone : number = 0; // 30 minutes in seconds

  isTimeOver : boolean = false;

  timeCloser$ : Subject<string> = new Subject<string>();

  private _validInfo : { shift_id : number, contestant : number } = { shift_id : 0 , contestant : 0 };

  protected btnSaveMyAnswers : { session : number, enable : boolean } = { session : 1 , enable : false };

  protected enableSubmitButton : boolean = false;

  protected strokeDasharray : string = '0 200';

  constructor(
    private router : Router ,
    private notificationService : NotificationService ,
    private nganHangCauHoiService : NganHangCauHoiService ,
    private nganHangDeService : NganHangDeService ,
    private shiftService : DotThiDanhSachService ,
    private shiftTestsService : DotThiKetQuaService ,
    private serverTimeService : ServerTimeService ,
    private authService : AuthService ,
    private helperService : HelperService
  ) {}

  ngOnInit() : void {
    this.checkInit();
  }

  checkInit() {
    const shift_id : number   = this.authService.getOption( KEY_NAME_SHIFT_ID );
    const contestant : number = this.authService.getOption( KEY_NAME_CONTESTANT_ID );
    if ( !Number.isNaN( shift_id ) && !Number.isNaN( contestant ) ) {
      this._validInfo.shift_id   = shift_id;
      this._validInfo.contestant = contestant;
      this._initTest();
    } else {
      void this.router.navigate( [ '/test/shift' ] );
    }
  }

  private _initTest() {
    this.notificationService.isProcessing( true );
    this.contestantInfo.phone = this.authService.getOption( KEY_NAME_CONTESTANT_PHONE );
    this._recheckData( this._validInfo.shift_id , this._validInfo.contestant ).subscribe( {
      next  : ( [ shiftTest , shift ] ) => {
        if ( shiftTest && shift ) {
          this.shift                          = shift;
          this.shiftTest                      = shiftTest;
          this.contestantInfo.testName        = shift.title;
          this.answerQuestions                = shiftTest.details || {};
          this.remainingTimeClone             = shiftTest.time;
          this.contestantInfo.totalQuestion   = shiftTest.question_ids.length;
          this.contestantInfo.answered        = Object.keys( this.answerQuestions ).length;
          this.contestantInfo.strokeDasharray = [ Math.floor( ( ( this.contestantInfo.answered * 113 ) / this.contestantInfo.totalQuestion ) ) , 200 ].join( ' ' );
          if ( shiftTest.state === 2 ) {
            this.contestantInfo.score          = shiftTest.score.toFixed( 2 );
            this.contestantInfo.number_correct = shiftTest.number_correct;
            this.mode                          = 'TEST_RESULT';
            this.contestantInfo.percentage_correct = shiftTest.number_correct+ '/'+ shiftTest.question_ids.length;
          } else {
            this.openStartTheTestDialog = true;
          }
        }
        this.notificationService.isProcessing( false );
      } ,
      error : () => {
        this.notificationService.isProcessing( false );
        this.notificationService.toastError( 'Mất kết nối với máy chủ' );
      }
    } );
  }

  private _recheckData( shift_id : number , contestant : number ) : Observable<[ ShiftTests , Shift ]> {
    return forkJoin<[ Shift , DateTimeServer ]>( [
      this.shiftService.getDataById( shift_id ) ,
      this.serverTimeService.getTime()
    ] ).pipe( switchMap( ( [ shift , dateTime ] ) : Observable<[ ShiftTests , Shift ]> => {
      const currentTime : Date = this.helperService.dateFormatWithTimeZone( dateTime.date );
      const startTime : Date   = this.helperService.dateFormatWithTimeZone( shift.time_start );
      const expiredTime : Date = this.helperService.dateFormatWithTimeZone( shift.time_end );
      return this.helperService.isBeforeDate( currentTime , expiredTime ) && this.helperService.isAfterDate( currentTime , startTime ) ? forkJoin<[ ShiftTests , Shift ]>( [
        this._getContestantShiftTest( shift , contestant ) ,
        of( shift )
      ] ) : of( [ null , null ] );
    } ) );
  }

  private _getContestantShiftTest( shift : Shift , contestant : number ) : Observable<ShiftTests> {
    return this.shiftTestsService.getShiftTest( shift.id , contestant ).pipe( switchMap( shiftTest => shiftTest ? of( shiftTest ) : this.createNewShiftTest( shift , contestant ) ) );
  }

  private createNewShiftTest( shift : Shift , contestant : number ) : Observable<ShiftTests> {
    return forkJoin<[ NganHangDe , NganHangCauHoi[] , DateTimeServer ]>( [
      this.nganHangDeService.getDataById( shift.bank_id ) ,
      this.nganHangCauHoiService.getDataByBankId( shift.bank_id , null , 'id' ) ,
      this.serverTimeService.getTime()
    ] ).pipe( switchMap( ( [ nganHangDe , questions , dateTime ] ) => {
      return this.shiftTestsService.createShiftTest( {
        shift_id     : shift.id ,
        thisinh_id   : contestant ,
        question_ids : this.randomQuestions( questions.map( u => u.id ) , nganHangDe.number_questions_per_test ) ,
        time_start   : this.helperService.formatSQLDateTime( this.helperService.dateFormatWithTimeZone( dateTime.date ) ) ,
        time         : Math.max( nganHangDe.time_per_test , 1 ) * 60
      } ).pipe( switchMap( id => this.shiftTestsService.getShiftTestById( id ) ) );
    } ) );
  }

  startTimer( remainingTime : number ) : void {
    const closer$ : Observable<string> = merge(
      this.destroy$ ,
      this.timeCloser$
    );

    this.mode = 'PANEL';
    interval( 1000 ).pipe( takeUntil( closer$ ) ).subscribe( () => {
      if ( remainingTime > 0 ) {
        remainingTime--;
        this.remainingTimeClone = remainingTime;
      } else {
        this.stopTimer();
        this.isTimeOver = true;
      }
    } );
  }

  getFormattedTime() : string {
    const minutes : number = Math.floor( this.remainingTimeClone / 60 );
    const seconds : number = this.remainingTimeClone % 60;
    return `${ String( minutes ).padStart( 2 , '0' ) }:${ String( seconds ).padStart( 2 , '0' ) }`;
  }

  stopTimer() : void {
    this.timeCloser$.next( 'close' );
  }

  randomQuestions( questions : number[] , length : number ) : number[] {
    const shuffledArray  = questions.sort( () => Math.random() - 0.5 );
    shuffledArray.length = Math.min( length , shuffledArray.length );
    return shuffledArray;
  }

  startTheTest() {
    this.openStartTheTestDialog = false;
    this.loadQuestion();
  }

  loadQuestion() {
    this.notificationService.isProcessing( true );
    this.nganHangCauHoiService.getTestQuestions( this.shiftTest.question_ids , 'id,bank_id,title,answer_options' ).subscribe( {
      next  : ( questions ) => {
        this.questions = questions.map( item => {
          const answered : number[] = this.answerQuestions[ item.id ];
          item[ '__answered' ]      = answered && Array.isArray( answered ) ? answered.join() : null;
          return item;
        } );
        this.startTimer( this.shiftTest.time );
        this.notificationService.isProcessing( false );
      } ,
      error : () => {
        this.notificationService.isProcessing( false );
        this.notificationService.toastError( 'Mất kết nối với máy chủ' );
      }
    } );
  }

  onAnswerQuestion( questionId : number , answers : number[] ) {
    if ( Array.isArray( answers ) ) {
      if ( answers.length ) {
        this.answerQuestions[ questionId ] = answers;
        this.triggerSaveMyAnswers();
      } else {
        delete this.answerQuestions[ questionId ];
        this.triggerSaveMyAnswers();
      }
    }
    this.contestantInfo.answered        = Object.keys( this.answerQuestions ).length;
    this.enableSubmitButton             = this.contestantInfo.answered === this.contestantInfo.totalQuestion;
    this.contestantInfo.strokeDasharray = [ Math.floor( ( ( this.contestantInfo.answered * 113 ) / this.contestantInfo.totalQuestion ) ) , 200 ].join( ' ' );
  }

  triggerSaveMyAnswers() {
    this.btnSaveMyAnswers.session += 1;
    this.btnSaveMyAnswers.enable = true;
  }

  async submitTheTest( needConfirm : boolean = false ) : Promise<void> {
    let running : boolean = false;
    if ( needConfirm ) {
      const headText : string    = 'Thông báo';
      const confirm : OvicButton = await this.notificationService.confirmRounded( `<p class="text-danger">Xác nhận nộp bài</p>` , headText );
      if ( confirm.name === 'yes' ) {
        running = true;
      }
    } else {
      running = true;
    }
    if ( running ) {
      this.notificationService.isProcessing( true );
      this.completeTheTest().subscribe( {
        next  : ( result : ShiftTestScore ) => {
          this.notificationService.isProcessing( false );
          this.mode                          = 'TEST_RESULT';
          this.contestantInfo.score          = result.score.toFixed( 2 );
          this.contestantInfo.number_correct = result.number_correct;
          this.contestantInfo.percentage_correct = result.number_correct +'/'+ this.shiftTest.question_ids.length;
          this.notificationService.toastSuccess( 'Nộp bài thành công' );
          this.stopTimer();
        } ,
        error : () => {
          this.notificationService.isProcessing( false );
          this.notificationService.toastError( 'Nộp bài thất bại' );
        }
      } );
    }
  }

  private completeTheTest() : Observable<ShiftTestScore> {
    return this.shiftTestsService.update( this.shiftTest.id , {
      state   : 2 ,
      details : this.answerQuestions ,
      time    : this.remainingTimeClone
    } ).pipe( switchMap( () => this.shiftTestsService.scoreTest( this.shiftTest.id ) ) );
  }


  btnOutTest() {
    this.authService.setOption( KEY_NAME_CONTESTANT_ID , 0 );
    this.authService.setOption( KEY_NAME_SHIFT_ID , 0 );
    this.authService.setOption( KEY_NAME_CONTESTANT_PHONE , '' );
    void this.router.navigate( [ '/test/shift' ] );
  }

  saveMyAnswers( session : number ) {
    this.shiftTestsService.update( this.shiftTest.id , { details : this.answerQuestions , time : this.remainingTimeClone } ).pipe(
      switchMap( () => of( session ) ) ,
      catchError( () => of( 0 ) )
    ).subscribe( ( _session : number ) => {
      if ( _session === this.btnSaveMyAnswers.session ) {
        this.btnSaveMyAnswers.enable = false;
        this.notificationService.toastSuccess( 'Hệ thống đã lưu bài làm ở thời điểm hiện tại' );
      } else {
        this.btnSaveMyAnswers.enable = true;
      }
    } );
  }

  ngOnDestroy() : void {
    if ( this.mode === 'PANEL' ) {
      const time : number          = this.remainingTimeClone;
      const details : ClientAnswer = this.answerQuestions;
      if ( time && details ) {
        this.shiftTestsService.update( this.shiftTest.id , { time , details } ).subscribe();
      }
    }
    this.destroy$.next( 'closed' );
    this.destroy$.complete();
    this.timeCloser$.complete();
  }
}
