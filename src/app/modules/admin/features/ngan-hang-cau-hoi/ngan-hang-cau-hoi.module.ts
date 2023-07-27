import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NganHangCauHoiRoutingModule } from './ngan-hang-cau-hoi-routing.module';
import { NganHangCauHoiComponent } from './ngan-hang-cau-hoi/ngan-hang-cau-hoi.component';
import { NganHangDeComponent } from './ngan-hang-de/ngan-hang-de.component';


@NgModule({
  declarations: [
    NganHangCauHoiComponent,
    NganHangDeComponent
  ],
  imports: [
    CommonModule,
    NganHangCauHoiRoutingModule
  ]
})
export class NganHangCauHoiModule { }
