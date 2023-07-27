import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NganHangDeComponent } from './ngan-hang-de.component';

describe('NganHangDeComponent', () => {
  let component: NganHangDeComponent;
  let fixture: ComponentFixture<NganHangDeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NganHangDeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NganHangDeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
