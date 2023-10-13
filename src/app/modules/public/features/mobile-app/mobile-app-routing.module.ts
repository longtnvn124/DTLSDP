import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {ClearComponent} from "@modules/public/features/clear/clear.component";
import {MobileHomeComponent} from "@modules/public/features/mobile-app/mobile-home/mobile-home.component";

const routes: Routes = [
  {
    path      : '' ,
    component : MobileHomeComponent,
    pathMatch  : 'prefix'
  } ,


];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MobileAppRoutingModule { }
