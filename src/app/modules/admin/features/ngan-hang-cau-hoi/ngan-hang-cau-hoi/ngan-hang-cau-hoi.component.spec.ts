import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NganHangCauHoiComponent } from './ngan-hang-cau-hoi.component';

describe('NganHangCauHoiComponent', () => {
  let component: NganHangCauHoiComponent;
  let fixture: ComponentFixture<NganHangCauHoiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NganHangCauHoiComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NganHangCauHoiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
