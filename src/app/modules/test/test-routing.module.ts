import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ShiftComponent} from "@modules/test/shift/shift.component";
import {PanelComponent} from "@modules/test/panel/panel.component";


const routes: Routes = [
  {
    path: 'shift',
    component: ShiftComponent,
    data: {state: 'test--shift'}
  },
  {
    path: 'panel',
    component: PanelComponent,
    data: {state: 'test--panel'}
  },
  {
    path: '',
    redirectTo: 'shift',
    pathMatch: 'prefix'
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TestRoutingModule {
}
