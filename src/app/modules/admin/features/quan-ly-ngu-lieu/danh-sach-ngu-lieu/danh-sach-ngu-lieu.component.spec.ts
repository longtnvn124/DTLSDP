import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DanhSachNguLieuComponent } from './danh-sach-ngu-lieu.component';

describe('DanhSachNguLieuComponent', () => {
  let component: DanhSachNguLieuComponent;
  let fixture: ComponentFixture<DanhSachNguLieuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DanhSachNguLieuComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DanhSachNguLieuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
