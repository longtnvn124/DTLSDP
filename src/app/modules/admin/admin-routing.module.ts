import { NgModule } from '@angular/core';
import { RouterModule , Routes } from '@angular/router';
import { ContentNoneComponent } from '@modules/admin/features/content-none/content-none.component';
import { DashboardComponent } from '@modules/admin/dashboard/dashboard.component';
import { NewHomeComponent } from '@modules/admin/features/new-home/new-home.component';
import { AdminGuard } from '@core/guards/admin.guard';

const routes : Routes = [
	{
		path             : '' ,
		component        : DashboardComponent ,
		canActivateChild : [ AdminGuard ] ,
		children         : [
			{
				path       : '' ,
				redirectTo : 'dashboard' ,
				pathMatch  : 'prefix'
			} ,
			{
				path      : 'dashboard' ,
				component : NewHomeComponent ,
				data      : { state : 'dashboard' }
			} ,
			{
				path      : 'content-none' ,
				component : ContentNoneComponent ,
				data      : { state : 'content-none' }
			} ,
			{
				path         : 'he-thong' ,
				loadChildren : () => import('@modules/admin/features/he-thong/he-thong.module').then( m => m.HeThongModule )
			} ,
			{
				path         : 'danh-muc' ,
				loadChildren : () => import('@modules/admin/features/danh-muc/danh-muc.module').then( m => m.DanhMucModule )
			} ,
			{
				path         : 'message' ,
				loadChildren : () => import('@modules/admin/features/ovic-message/ovic-message.module').then( m => m.OvicMessageModule )
			} ,
			{
				path         : 'quan-ly-ngu-lieu' ,
				loadChildren : () => import('@modules/admin/features/quan-ly-ngu-lieu/quan-ly-ngu-lieu.module').then( m => m.QuanLyNguLieuModule )
			} ,
			{
				path         : 'ngan-hang-cau-hoi' ,
				loadChildren : () => import('@modules/admin/features/ngan-hang-cau-hoi/ngan-hang-cau-hoi.module').then( m => m.NganHangCauHoiModule )
			} ,
			{
				path         : 'quan-ly-dot-thi' ,
				loadChildren : () => import('@modules/admin/features/quan-ly-dot-thi/quan-ly-dot-thi.module').then( m => m.QuanLyDotThiModule )
			} ,
			// {
			// 	path         : 'khoi-cum' ,
			// 	loadChildren : () => import('@modules/admin/features/khoi-cum/khoi-cum.module').then( m => m.KhoiCumModule )
			// } ,
			// {
			// 	path         : 'phong-trao-thi-dua' ,
			// 	loadChildren : () => import('@modules/admin/features/phong-trao-thi-dua/phong-trao-thi-dua.module').then( m => m.PhongTraoThiDuaModule )
			// } ,
			// {
			// 	path         : 'thong-ke' ,
			// 	loadChildren : () => import('@modules/admin/features/thong-ke/thong-ke.module').then( m => m.ThongKeModule )
			// } ,
			{
				path       : '**' ,
				redirectTo : '/admin/content-none' ,
				pathMatch  : 'prefix'
			}
		]
	}
];

@NgModule( {
	imports : [ RouterModule.forChild( routes ) ] ,
	exports : [ RouterModule ]
} )
export class AdminRoutingModule {}
