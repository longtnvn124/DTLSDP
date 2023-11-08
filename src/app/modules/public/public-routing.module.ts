import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ContentNoneComponent} from './features/content-none/content-none.component';
import {UnauthorizedComponent} from './features/unauthorized/unauthorized.component';
import {ClearComponent} from './features/clear/clear.component';
import {LoginVideoComponent} from '@modules/public/features/login-video/login-video.component';
import {VirtualTourComponent} from "@modules/public/features/virtual-tour/virtual-tour.component";
import {ResetPasswordComponent} from "@modules/public/features/reset-password/reset-password.component";
import {DesktopGuard} from "@modules/public/desktop.guard";
import {MobileGuard} from "@modules/public/mobile.guard";

const routes: Routes = [
  {
    path: 'unauthorized',
    component: UnauthorizedComponent
  },
  {
    path: 'clear',
    component: ClearComponent
  },
  {
    path: 'home',
    canActivate: [DesktopGuard],
    loadChildren: () => import('@modules/public/features/home/home.module').then(m => m.HomeModule)
  },
  {
    path: 'login',
    component: LoginVideoComponent
  },

  // {
  // 	path      : 'login-video' ,
  // 	component : LoginVideoComponent
  // } ,
  // {
  // 	path      : 'login-2' ,
  //  component : LoginV2Component
  // } ,
  {
    path: 'virtual-tour',
    component: VirtualTourComponent
  },
  {
    path: 'content-none',
    component: ContentNoneComponent
  },

  {
    path: 'reset-password',
    component: ResetPasswordComponent
  },
  {
    path: 'mobile',
    canActivate: [MobileGuard],
    loadChildren: () => import('@modules/public/features/mobile-app/mobile-app.module').then(m => m.MobileAppModule)
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'prefix'
  },
  // {
  //   path: '**',
  //   redirectTo: 'home',
  //   pathMatch: 'prefix'
  // }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PublicRoutingModule {
}
