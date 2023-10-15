import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MobileAppRoutingModule } from './mobile-app-routing.module';
import { MobileHomeComponent } from './mobile-home/mobile-home.component';
import {GalleriaModule} from "primeng/galleria";
import { MobileNhanVatComponent } from './mobi-layouts/mobile-nhan-vat/mobile-nhan-vat.component';
import { MobileSuKienComponent } from './mobi-layouts/mobile-su-kien/mobile-su-kien.component';
import { MobileNgulieuVrComponent } from './mobi-layouts/mobile-ngulieu-vr/mobile-ngulieu-vr.component';
import { MobileChuyenMucComponent } from './mobi-layouts/mobile-chuyen-muc/mobile-chuyen-muc.component';
import { MainLayoutComponent } from './main-layout/main-layout.component';


@NgModule({
  declarations: [
    MobileHomeComponent,
    MobileNhanVatComponent,
    MobileSuKienComponent,
    MobileNgulieuVrComponent,
    MobileChuyenMucComponent,
    MainLayoutComponent
  ],
  imports: [
    CommonModule,
    MobileAppRoutingModule,
    GalleriaModule
  ]
})
export class MobileAppModule { }
