import {Component, Input, OnInit} from '@angular/core';
import {AbstractControl} from "@angular/forms";
import {AnswerOption} from "@shared/models/quan-ly-ngan-hang";
import {debounceTime, Subject} from "rxjs";

@Component({
  selector: 'app-answer-option-group',
  templateUrl: './answer-option-group.component.html',
  styleUrls: ['./answer-option-group.component.css']
})
export class AnswerOptionGroupComponent implements OnInit {

  @Input() _formControl: AbstractControl<AnswerOption[]>;

  @Input() correctAnswerControl: AbstractControl<number[]>;

  options: AnswerOption[] = [
    {id:1, value:''},
    {id:2, value:''},
    {id:3, value:''},
  ];

  correctAnswer: number[] = [];

  constructor() {
  }

  ngOnInit(): void {
    if (this._formControl) {
      this._formControl.valueChanges.subscribe(options => this.options = options && Array.isArray(options) ? options : []);
      this.options = this._formControl.value && Array.isArray(this._formControl.value) ? this._formControl.value : [];
    }
    if (this.correctAnswerControl) {
      this.correctAnswerControl.valueChanges.subscribe(correctAnswer => this.correctAnswer = correctAnswer && Array.isArray(correctAnswer) ? correctAnswer : []);
      this.correctAnswer = this.correctAnswerControl.value && Array.isArray(this.correctAnswerControl.value) ? this.correctAnswerControl.value : [];
    }
  }


  addMoreAnswer() {
    if (this._formControl) {
      const oldValue = Array.isArray(this._formControl.value) ? this._formControl.value : [];
      const _id = oldValue.reduce((max, item) => max < item.id ? item.id : max, 0)
      const value = '';
      oldValue.push({id: _id + 1, value});
      this._formControl.setValue(oldValue);
    }

  }

  deleteItem(id: number) {
    if (id === this.correctAnswer.find(f => f === id)) {
      this.correctAnswerControl.setValue(this.correctAnswer.filter(f => f !== id));
    }
    const u = this._formControl.value.filter(f => f.id !== id);
    this._formControl.setValue(u);
  }

  selectItem(id: number) {
    if (this.correctAnswerControl) {
      const oldValue = Array.isArray(this.correctAnswerControl.value) ? this.correctAnswerControl.value : [];

      const newValue = oldValue.includes(id) ? oldValue.filter(u => u !== id) : [...oldValue, id];
      this.correctAnswerControl.setValue(newValue);
    }
  }

}
