import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {ClearComponent} from "@modules/public/features/clear/clear.component";
import {MobileHomeComponent} from "@modules/public/features/mobile-app/mobile-home/mobile-home.component";
import {MainLayoutComponent} from "@modules/public/features/mobile-app/main-layout/main-layout.component";
import {
  MobileChuyenMucComponent
} from "@modules/public/features/mobile-app/mobi-layouts/mobile-chuyen-muc/mobile-chuyen-muc.component";
import {
  MobileNgulieuVrComponent
} from "@modules/public/features/mobile-app/mobi-layouts/mobile-ngulieu-vr/mobile-ngulieu-vr.component";

const routes: Routes = [
  // {
  //   path      : '' ,
  //   component : MobileHomeComponent,
  //   // pathMatch  : 'prefix',
  //
  // } ,

  {
    path:'',
    component:MainLayoutComponent,
    children:[
      {
        path:'mobile-chuyen-muc',
        component:MobileChuyenMucComponent,
      },
      {
        path:'mobile-tim-kiem',
        component:MobileChuyenMucComponent,
      },
      {
        path:'mobile-ngu-lieu-vr',
        component:MobileNgulieuVrComponent,
      },
      {
        path:'mobile-chuyen-muc',
        component:MobileChuyenMucComponent,
      },
      {
        path:'',
        component:MobileHomeComponent
      }
    ]
  }


];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MobileAppRoutingModule { }
