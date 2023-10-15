import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileNhanVatComponent } from './mobile-nhan-vat.component';

describe('MobileNhanVatComponent', () => {
  let component: MobileNhanVatComponent;
  let fixture: ComponentFixture<MobileNhanVatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MobileNhanVatComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MobileNhanVatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
