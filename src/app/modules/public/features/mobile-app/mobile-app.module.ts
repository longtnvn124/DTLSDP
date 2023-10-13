import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MobileAppRoutingModule } from './mobile-app-routing.module';
import { MobileHomeComponent } from './mobile-home/mobile-home.component';
import {GalleriaModule} from "primeng/galleria";


@NgModule({
  declarations: [
    MobileHomeComponent
  ],
  imports: [
    CommonModule,
    MobileAppRoutingModule,
    GalleriaModule
  ]
})
export class MobileAppModule { }
