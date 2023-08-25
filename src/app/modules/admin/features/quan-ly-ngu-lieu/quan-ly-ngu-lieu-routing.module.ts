import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
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
    path: 'danh-sach-ngu-lieu-anh-vr',
    component: NguLieuVideoVrComponent,
    data: {state: 'quan-ly-ngu-lieu--danh-sach-ngu-lieu-anh-vr'}
  },
  {
    path: 'danh-sach-ngu-lieu-video-vr',
    component: NguLieuImageVrComponent,
    data: {state: 'quan-ly-ngu-lieu--danh-sach-ngu-lieu-video-vr'}
  },
  {
    path: 'danh-sach-ngu-lieu',
    component: DanhSachNguLieuComponent,
    data: {state: 'quan-ly-ngu-lieu--danh-sach-ngu-lieu'}
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
