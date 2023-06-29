import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { QuanLyNguLieuRoutingModule } from './quan-ly-ngu-lieu-routing.module';
import { DanhSachNguLieuComponent } from './danh-sach-ngu-lieu/danh-sach-ngu-lieu.component';
import { DanhSachSuKienComponent } from './danh-sach-su-kien/danh-sach-su-kien.component';
import { ContextMenuModule } from 'primeng/contextmenu';


@NgModule({
  declarations: [
    DanhSachNguLieuComponent,
    DanhSachSuKienComponent
  ],
  imports: [
    CommonModule,
    QuanLyNguLieuRoutingModule,
    ContextMenuModule
  ]
})
export class QuanLyNguLieuModule { }
