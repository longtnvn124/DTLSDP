import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { QuanLyDotThiRoutingModule } from './quan-ly-dot-thi-routing.module';
import { DotThiDanhSachComponent } from './dot-thi-danh-sach/dot-thi-danh-sach.component';
import { DotThiThiSinhComponent } from './dot-thi-thi-sinh/dot-thi-thi-sinh.component';
import {ButtonModule} from "primeng/button";
import {SharedModule} from "@shared/shared.module";
import {PaginatorModule} from "primeng/paginator";
import {ReactiveFormsModule} from "@angular/forms";
import {CalendarModule} from "primeng/calendar";
import {RippleModule} from "primeng/ripple";
import {TableModule} from "primeng/table";
import {TestModule} from "@modules/test/test.module";
import {EditorModule} from "primeng/editor";
import {SplitterModule} from "primeng/splitter";

import Quill from 'quill';
import ImageResize from 'quill-image-resize-module';
import {InputTextModule} from "primeng/inputtext";
import {TooltipModule} from "primeng/tooltip";
Quill.register('modules/imageResize', ImageResize);

@NgModule({
  declarations: [
    DotThiDanhSachComponent,
    DotThiThiSinhComponent
  ],
  imports: [
    CommonModule,
    QuanLyDotThiRoutingModule,
    ButtonModule,
    SharedModule,
    PaginatorModule,
    ReactiveFormsModule,
    CalendarModule,
    RippleModule,
    TableModule,
    TestModule,
    EditorModule,
    SplitterModule,
    InputTextModule,
    TooltipModule
  ]
})
export class QuanLyDotThiModule { }
