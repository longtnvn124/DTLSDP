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
import {
  MobileNhanVatComponent
} from "@modules/public/features/mobile-app/mobi-layouts/mobile-nhan-vat/mobile-nhan-vat.component";
import {
  MobileChuyenDeComponent
} from "@modules/public/features/mobile-app/mobi-layouts/mobile-chuyen-de/mobile-chuyen-de.component";
import {
  MobileSuKienComponent
} from "@modules/public/features/mobile-app/mobi-layouts/mobile-su-kien/mobile-su-kien.component";
import {
  MobileGioiThieuComponent
} from "@modules/public/features/mobile-app/mobi-layouts/mobile-gioi-thieu/mobile-gioi-thieu.component";
import {
  MobileTinTucComponent
} from "@modules/public/features/mobile-app/mobi-layouts/mobile-tin-tuc/mobile-tin-tuc.component";
import {
  MobileThongBaoComponent
} from "@modules/public/features/mobile-app/mobi-layouts/mobile-thong-bao/mobile-thong-bao.component";

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
        path:'mobile-chuyen-de',
        component:MobileChuyenDeComponent,
      },
      {
        path:'mobile-chuyen-muc',
        component:MobileChuyenMucComponent,
      },
      {
        path:'mobile-nhan-vat',
        component:MobileNhanVatComponent,
      },
      {
        path:'mobile-tim-kiem',
        component:MobileChuyenMucComponent,
      },
      {
        path:'mobile-vr-360',
        component:MobileNgulieuVrComponent,
      },
      {
        path:'mobile-chuyen-muc',
        component:MobileChuyenMucComponent,
      },
      {
        path:'mobile-su-kien',
        component:MobileSuKienComponent,
      },
      {
        path:'mobile-gioi-thieu',
        component:MobileGioiThieuComponent,
      },
      {
        path:'mobile-tin-tuc',
        component:MobileTinTucComponent,
      },
      {
        path:'mobile-thong-bao',
        component:MobileThongBaoComponent,
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
