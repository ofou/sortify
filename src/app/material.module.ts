import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { NgModule } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {MatSortModule} from '@angular/material/sort';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatSelectModule} from '@angular/material/select';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatRippleModule} from '@angular/material/core';


const modules: any[] = [
  MatButtonModule,
  MatCheckboxModule,
  MatListModule,
  MatTableModule,
  MatIconModule,
  MatTooltipModule,
  MatProgressBarModule,
  MatProgressSpinnerModule,
  MatSortModule,
  MatToolbarModule,
  MatSelectModule,
  FormsModule,
  ReactiveFormsModule,
  MatRippleModule
];

@NgModule({
  imports: modules,
  exports: modules,
})
export class MaterialModule {}
