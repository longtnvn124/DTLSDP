import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {DanhMucRoutingModule} from './danh-muc-routing.module';
import {SharedModule} from '@shared/shared.module';
import {ButtonModule} from 'primeng/button';
import {RippleModule} from 'primeng/ripple';
import {ReactiveFormsModule} from '@angular/forms';
import {DropdownModule} from 'primeng/dropdown';
import {PaginatorModule} from 'primeng/paginator';

import {InputMaskModule} from 'primeng/inputmask';
import { ChuyenMucComponent } from './chuyen-muc/chuyen-muc.component';
import { LinhVucComponent } from './linh-vuc/linh-vuc.component';
import { LoaiNguLieuComponent } from './loai-ngu-lieu/loai-ngu-lieu.component';
import { DiemDiTichComponent } from './diem-di-tich/diem-di-tich.component';
import { NhanVatLichSuComponent } from './nhan-vat-lich-su/nhan-vat-lich-su.component';
import {DialogModule} from 'primeng/dialog';
import { EditorModule } from 'primeng/editor'
import { ContextMenuModule } from 'primeng/contextmenu';
import { MediavrComponent } from './mediavr/mediavr.component';
import { MultiSelectModule } from 'primeng/multiselect';

@NgModule({
  declarations: [
    ChuyenMucComponent,
    LinhVucComponent,
    LoaiNguLieuComponent,
    DiemDiTichComponent,
    NhanVatLichSuComponent,
    MediavrComponent,

  ],
  imports: [
    CommonModule,
    DanhMucRoutingModule,
    SharedModule,
    ButtonModule,
    RippleModule,
    ReactiveFormsModule,
    DropdownModule,
    PaginatorModule,
    InputMaskModule,
    DialogModule,
    EditorModule,
    ContextMenuModule,
    MultiSelectModule
  ]
})
export class DanhMucModule {
}
