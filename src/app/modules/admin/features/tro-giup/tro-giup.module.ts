import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TroGiupRoutingModule } from './tro-giup-routing.module';
import { HuongDanSuDungComponent } from './huong-dan-su-dung/huong-dan-su-dung.component';
import {YouTubePlayerModule} from "@angular/youtube-player";
@NgModule({
  declarations: [
    HuongDanSuDungComponent
  ],
  imports: [
    CommonModule,
    TroGiupRoutingModule,
    YouTubePlayerModule,
  ]
})
export class TroGiupModule { }
