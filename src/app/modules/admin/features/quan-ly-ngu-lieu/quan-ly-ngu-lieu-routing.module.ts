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
import {
  NguLieuVideoVrComponent
} from "@modules/admin/features/quan-ly-ngu-lieu/ngu-lieu-video-vr/ngu-lieu-video-vr.component";
import {
  NguLieuImageVrComponent
} from "@modules/admin/features/quan-ly-ngu-lieu/ngu-lieu-image-vr/ngu-lieu-image-vr.component";

const routes: Routes = [
  {
    path: 'ngu-lieu-img-vr',
    component: NguLieuVideoVrComponent,
    data: {state: 'quan-ly-ngu-lieu--ngu-lieu-img-vr'}
  },
  {
    path: 'ngu-lieu-video-vr',
    component: NguLieuImageVrComponent,
    data: {state: 'quan-ly-ngu-lieu--ngu-lieu-img-vr'}
  },
  {
    path: 'danh-sach',
    component: DanhSachNguLieuComponent,
    data: {state: 'quan-ly-ngu-lieu--danhsach'}
  },
  {
    path: 'su-kien',
    component: DanhSachSuKienComponent,
    data: {state: 'quan-ly-ngu-lieu--sukien'}
  },
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class QuanLyNguLieuRoutingModule { }
