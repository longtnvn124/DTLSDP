import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { QuanLyNguLieuRoutingModule } from './quan-ly-ngu-lieu-routing.module';
import { DanhSachNguLieuComponent } from './danh-sach-ngu-lieu/danh-sach-ngu-lieu.component';
import { DanhSachSuKienComponent } from './danh-sach-su-kien/danh-sach-su-kien.component';
import { ContextMenuModule } from 'primeng/contextmenu';
import {SharedModule} from "@shared/shared.module";
import {PaginatorModule} from "primeng/paginator";
import {ReactiveFormsModule} from "@angular/forms";
import {ButtonModule} from "primeng/button";
import { MultiSelectModule } from 'primeng/multiselect';
import {RippleModule} from "primeng/ripple";
import {TableModule} from "primeng/table";
import {InputMaskModule} from "primeng/inputmask";
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import {InputTextareaModule} from 'primeng/inputtextarea';
import { NguLieuVideoVrComponent } from './ngu-lieu-video-vr/ngu-lieu-video-vr.component';
import { NguLieuImageVrComponent } from './ngu-lieu-image-vr/ngu-lieu-image-vr.component';
import { DanhNhanLichSuComponent } from './danh-nhan-lich-su/danh-nhan-lich-su.component';
import {EditorModule} from "primeng/editor";


@NgModule({
  declarations: [
    DanhSachNguLieuComponent,
    DanhSachSuKienComponent,
    NguLieuVideoVrComponent,
    NguLieuImageVrComponent,
    DanhNhanLichSuComponent,
  ],
    imports: [
        CommonModule,
        QuanLyNguLieuRoutingModule,
        ContextMenuModule,
        SharedModule,
        PaginatorModule,
        ReactiveFormsModule,
        ButtonModule,
        MultiSelectModule,
        RippleModule,
        TableModule,
        InputMaskModule,
        InputTextModule,
        DialogModule,
        InputTextareaModule,
        EditorModule
    ]
})
export class QuanLyNguLieuModule { }
