import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {ChuyenMucComponent} from "@modules/admin/features/danh-muc/chuyen-muc/chuyen-muc.component";
import {DiemDiTichComponent} from "@modules/admin/features/danh-muc/diem-di-tich/diem-di-tich.component";
import {LinhVucComponent} from "@modules/admin/features/danh-muc/linh-vuc/linh-vuc.component";
import {LoaiNguLieuComponent} from "@modules/admin/features/danh-muc/loai-ngu-lieu/loai-ngu-lieu.component";
import {NhanVatLichSuComponent} from "@modules/admin/features/danh-muc/nhan-vat-lich-su/nhan-vat-lich-su.component";
import {
  DanhSachNguLieuComponent
} from "@modules/admin/features/quan-ly-ngu-lieu/danh-sach-ngu-lieu/danh-sach-ngu-lieu.component";
import {
  DanhSachSuKienComponent
} from "@modules/admin/features/quan-ly-ngu-lieu/danh-sach-su-kien/danh-sach-su-kien.component";

const routes: Routes = [
  {
    path: 'danh-sach-ngu-lieu',
    component: DanhSachNguLieuComponent,
    data: {state: 'quan-ly-ngu-lieu--danhsach'}
  },
  {
    path: 'danh-sach-su-kien',
    component: DanhSachSuKienComponent,
    data: {state: 'quan-ly-ngu-lieu--sukien'}
  },
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class QuanLyNguLieuRoutingModule { }
