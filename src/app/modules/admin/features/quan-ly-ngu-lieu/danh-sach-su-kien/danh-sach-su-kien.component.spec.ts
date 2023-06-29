import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DanhSachSuKienComponent } from './danh-sach-su-kien.component';

describe('DanhSachSuKienComponent', () => {
  let component: DanhSachSuKienComponent;
  let fixture: ComponentFixture<DanhSachSuKienComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DanhSachSuKienComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DanhSachSuKienComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
