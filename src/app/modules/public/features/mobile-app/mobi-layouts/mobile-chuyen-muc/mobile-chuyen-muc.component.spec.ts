import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileChuyenMucComponent } from './mobile-chuyen-muc.component';

describe('MobileChuyenMucComponent', () => {
  let component: MobileChuyenMucComponent;
  let fixture: ComponentFixture<MobileChuyenMucComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MobileChuyenMucComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MobileChuyenMucComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
