import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestDateInputComponent } from './test-date-input.component';

describe('TestDateInputComponent', () => {
  let component: TestDateInputComponent;
  let fixture: ComponentFixture<TestDateInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TestDateInputComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestDateInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
