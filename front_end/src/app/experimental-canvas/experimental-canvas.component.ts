import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { ColorPickerComponent } from '../components/color-picker/color-picker.component';

// import { ColorPickerComponent } from 'ngx-colors/lib/components/color-picker/color-picker.component';
@Component({
  selector: 'app-experimental-canvas',
  standalone: true,
  imports: [CommonModule,ColorPickerComponent],
  templateUrl: './experimental-canvas.component.html',
  styleUrl: './experimental-canvas.component.css',
})
export class ExperimentalCanvasComponent  {
  public hue: string='green';
  public color: string|undefined;
}

