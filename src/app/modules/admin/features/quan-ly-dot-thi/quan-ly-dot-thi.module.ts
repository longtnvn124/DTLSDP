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
        TestModule
    ]
})
export class QuanLyDotThiModule { }
