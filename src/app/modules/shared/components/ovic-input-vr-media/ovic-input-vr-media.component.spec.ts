import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OvicInputVrMediaComponent } from './ovic-input-vr-media.component';

describe('OvicInputVrMediaComponent', () => {
  let component: OvicInputVrMediaComponent;
  let fixture: ComponentFixture<OvicInputVrMediaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OvicInputVrMediaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OvicInputVrMediaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
