import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {DDMMYYYYDateFormatValidator, PhoneNumberValidator} from '@core/utils/validators';
import {debounceTime, distinctUntilChanged, mergeMap, Observable, Subject, Subscription, takeUntil} from 'rxjs';
import {filter, map} from 'rxjs/operators';
import {NewContestant, ThiSinhService} from '@shared/services/thi-sinh.service';
import {AuthService} from '@core/services/auth.service';
import {Router} from '@angular/router';
import {KEY_NAME_CONTESTANT_ID, KEY_NAME_CONTESTANT_PHONE} from '@shared/utils/syscat';

interface PhoneChecker {
  validatePhoneContestant(phoneNumber: string): Observable<number>;
}

class PhoneValidator {
  private _error: boolean;
  private _checking: boolean;
  private _checked: boolean;
  private _contestantId: number;
  private _checker: PhoneChecker;
  private _openFormDetail: boolean;
  private subscription: Subscription = new Subscription();

  constructor(
    formControl: AbstractControl,
    destroy$: Subject<string>,
    checker: PhoneChecker
  ) {
    this._checker = checker;
    this._checking = false;
    this._checked = false;
    this._error = false;
    this._openFormDetail = false;
    this._contestantId = 0;

    formControl.valueChanges.pipe(
      takeUntil(destroy$),
      filter(() => formControl.valid),
      debounceTime(500),
      map(value => value ? value.replace(/\s/g, '').replace(/-{2,}/g, '-') : '')
    ).subscribe(value => {
      this._checked = false;
      if (value) {
        formControl.setValue(value, {emitEvent: false});
      }
    });

    formControl.valueChanges.pipe(
      takeUntil(destroy$),
      filter(() => formControl.valid),
      debounceTime(1000),
      distinctUntilChanged()
    ).subscribe((phoneNumber: string) => this._isPhoneNumberExistFn(phoneNumber));

    destroy$.subscribe(() => {
      if (this.subscription) {
        this.subscription.unsubscribe();
      }
    });
  }

  get checked(): boolean {
    return this._checked;
  }

  get onChecking(): boolean {
    return this._checking;
  }

  get contestantId(): number {
    return this._contestantId;
  }

  get error(): boolean {
    return this._error;
  }

  get openFormDetail(): boolean {
    return this._openFormDetail;
  }

  get isContestantIdEmpty(): boolean {
    return !Boolean(this._contestantId);
  }

  private _isPhoneNumberExistFn(newValue: string) {
    this._error = false;
    this._checked = false;
    this._checking = true;
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.subscription = this._checker.validatePhoneContestant(newValue).subscribe({
      next: (contestantId) => {
        this._contestantId = contestantId;
        this._checking = false;
        this._checked = true;
        this._openFormDetail = contestantId === 0;
      },
      error: () => {
        this._checking = false;
        this._checked = false;
        this._error = true;
      }
    });
  }
}

@Component({
  selector: 'app-contestant',
  templateUrl: './contestant.component.html',
  styleUrls: ['./contestant.component.css']
})
export class ContestantComponent implements OnInit, OnDestroy {

  formGroup: FormGroup = this.fb.group({
    full_name: ['', [Validators.required, Validators.maxLength(50), Validators.minLength(1)]],
    name: [''],
    phone: ['', [Validators.required, Validators.maxLength(12), Validators.minLength(6)]],
    dob: ['', [Validators.required, DDMMYYYYDateFormatValidator]],
    sex: ['', [Validators.required]],
    address: ['', [Validators.required]]
  });

  destroy$: Subject<string> = new Subject<string>();

  phoneValidator: PhoneValidator;

  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private thiSinhService: ThiSinhService,
    private router: Router,
    private auth: AuthService
  ) {
    const formControlPhone: AbstractControl = this.formGroup.get('phone');
    this.phoneValidator = new PhoneValidator(formControlPhone, this.destroy$, thiSinhService);
    formControlPhone.valueChanges.subscribe((text: string) => {
      const textClear = text ? text : text.replace(/\./g, '').replace(/\-/g, '').replace(/\_/g, '').replace(/\(/g, '').replace(/\)/g, '');
      formControlPhone.setValue(textClear);
    });
  }

  get f(): { [key: string]: AbstractControl } {
    return this.formGroup.controls;
  }

  ngOnInit(): void {
    if (this.auth.getOption(KEY_NAME_CONTESTANT_PHONE)) {
      this.formGroup.get('phone').setValue(this.auth.getOption(KEY_NAME_CONTESTANT_PHONE));
    }
  }

  changeUserSex(value: 'nam' | 'nu') {
    this.f['sex'].setValue(value);
  }

  assignContestantInfo() {
    this.isLoading = true;
    this.f['name'].setValue(this.f['full_name'].value.split(' ').pop());
    const newContestant: NewContestant = JSON.parse(JSON.stringify(this.formGroup.value));
    newContestant.dob = newContestant.dob.split('/').reverse().join('/'); /*convert dd/mm/yyyy to yyyy/mm/dd format*/
    this.thiSinhService.assignNewContestant(newContestant).pipe(mergeMap(() => this.thiSinhService.validatePhoneContestant(this.f['phone'].value))).subscribe({
      next: (id) => {
        if (id) {
          this.saveContestantInfo({id, phone: this.formGroup.get('phone').value});
          this.goToTest(false);
        }
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  goToTest(saveLastContestantInfo: boolean = true) {
    if (saveLastContestantInfo) {
      this.saveContestantInfo({id: this.phoneValidator.contestantId, phone: this.formGroup.get('phone').value});
    }
    void this.router.navigate(['/test/panel']);
  }

  private saveContestantInfo(info: { id?: number, phone?: string }) {
    if (info.id) {
      this.auth.setOption(KEY_NAME_CONTESTANT_ID, info.id);
    }
    if (info.phone) {
      this.auth.setOption(KEY_NAME_CONTESTANT_PHONE, info.phone);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next('completed');
    this.destroy$.complete();
  }

}
