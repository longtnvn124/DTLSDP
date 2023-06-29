import {Component, OnInit} from '@angular/core';
import {Observable, of, share, Subject, switchMap, throwError} from "rxjs";
import {catchError} from "rxjs/operators";

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css']
})
export class TestComponent implements OnInit {

  readonly clickEvent = new Subject<number>();

  numb = 0;

  constructor() {
  }

  ngOnInit(): void {
    this.clickEvent.asObservable().pipe(share()).subscribe(u => console.log(u));
    this.clickEvent.asObservable().pipe(share(), switchMap(n => this.saveGardValidNumber(n))).subscribe({
      next: value => console.log('valid number: ' + value),
      error: m => {
        console.log(m);
      },
    })
  }

  validNumber(n: number): Observable<number> {
    return n < 4 ? of(n) : throwError(() => new Error(`max number is 4`));
  }

  saveGardValidNumber(u: number): Observable<number> {
    return this.validNumber(u).pipe(catchError(error => of(0)));
  }

  validateValue(event: KeyboardEvent) {
    console.log(event.target['value']);
    console.log(event);
  }

  checkClick(event) {
    this.clickEvent.next(++this.numb);
  }
}
