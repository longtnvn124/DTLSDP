import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { QuanLyChuyenDeRoutingModule } from './quan-ly-chuyen-de-routing.module';
import { ChuyenDeComponent } from './chuyen-de/chuyen-de.component';
import {NgbTooltipModule} from "@ng-bootstrap/ng-bootstrap";
import {ReactiveFormsModule} from "@angular/forms";
import {TabViewModule} from "primeng/tabview";
import {SharedModule} from "@shared/shared.module";
import {MultiSelectModule} from "primeng/multiselect";
import {CheckboxModule} from "primeng/checkbox";
import {RadioButtonModule} from "primeng/radiobutton";
import {MatProgressBarModule} from "@angular/material/progress-bar";
import {DragDropModule} from "@angular/cdk/drag-drop";
import {ButtonModule} from "primeng/button";
import {RippleModule} from "primeng/ripple";
import {TabMenuModule} from "primeng/tabmenu";
import {EditorModule} from "primeng/editor";
@NgModule({
  declarations: [
    ChuyenDeComponent
  ],
  imports: [
    CommonModule,
    QuanLyChuyenDeRoutingModule,
    NgbTooltipModule,
    ReactiveFormsModule,
    TabViewModule,
    SharedModule,
    MultiSelectModule,
    CheckboxModule,
    RadioButtonModule,
    MatProgressBarModule,
    DragDropModule,
    ButtonModule,
    RippleModule,
    TabMenuModule,
    EditorModule
  ]
})
export class QuanLyChuyenDeModule { }
