import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileSuKienComponent } from './mobile-su-kien.component';

describe('MobileSuKienComponent', () => {
  let component: MobileSuKienComponent;
  let fixture: ComponentFixture<MobileSuKienComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MobileSuKienComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MobileSuKienComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
