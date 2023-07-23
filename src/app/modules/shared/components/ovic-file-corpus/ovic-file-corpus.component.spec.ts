import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OvicFileCorpusComponent } from './ovic-file-corpus.component';

describe('OvicFileCorpusComponent', () => {
  let component: OvicFileCorpusComponent;
  let fixture: ComponentFixture<OvicFileCorpusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OvicFileCorpusComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OvicFileCorpusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
