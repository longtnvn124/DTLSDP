import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileNgulieuVrComponent } from './mobile-ngulieu-vr.component';

describe('MobileNgulieuVrComponent', () => {
  let component: MobileNgulieuVrComponent;
  let fixture: ComponentFixture<MobileNgulieuVrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MobileNgulieuVrComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MobileNgulieuVrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
