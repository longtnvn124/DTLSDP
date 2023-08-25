import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DanhmucNgulieusoComponent } from './danhmuc-ngulieuso.component';

describe('DanhmucNgulieusoComponent', () => {
  let component: DanhmucNgulieusoComponent;
  let fixture: ComponentFixture<DanhmucNgulieusoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DanhmucNgulieusoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DanhmucNgulieusoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
