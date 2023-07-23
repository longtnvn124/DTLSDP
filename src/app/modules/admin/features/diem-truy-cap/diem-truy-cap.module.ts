import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DiemTruyCapRoutingModule } from './diem-truy-cap-routing.module';
import { DanhSachDiemTruyCapComponent } from './danh-sach-diem-truy-cap/danh-sach-diem-truy-cap.component';
import {SharedModule} from "@shared/shared.module";
import {PaginatorModule} from "primeng/paginator";


@NgModule({
  declarations: [
    DanhSachDiemTruyCapComponent
  ],
  imports: [
    CommonModule,
    DiemTruyCapRoutingModule,
    SharedModule,
    PaginatorModule
  ]
})
export class DiemTruyCapModule { }
