import {
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { fabric } from 'fabric';
import Color from 'color';
import { CanvasService } from '../../services/canvas/canvas.service';
import { GradientColorstopManipulatorComponent } from './gradient-colorstop-manipulator/gradient-colorstop-manipulator.component';
import { ColorContainerComponent } from './color-container/color-container.component';
import { ColorStop } from '../../../types/color-picker.types';
import { IncludePropertiesOnly } from '../../../types/app.types';

@Component({
  selector: 'app-color-picker',
  standalone: true,
  imports: [GradientColorstopManipulatorComponent, ColorContainerComponent],
  templateUrl: './color-picker.component.html',
  styleUrl: './color-picker.component.css',
})
export class ColorPickerComponent {
  constructor(public canvasService: CanvasService) {}
  @Output() onColorChnage = new EventEmitter<string | fabric.Gradient>();
  @Input({ required: true }) targetNameToColor: keyof fabric.Object | null =
    null;
  @Input() width: number = 300;

  gradientColorStopIndex: number | null = null;

  colorCatch: string | fabric.Gradient | fabric.Pattern | null = null;

  get colorPresets() {
    return [
      ...this.canvasService.existingColorsPreset(this.canvasService.objects),
    ];
  }

  get fillColorFormateType() {
    const objs = this.canvasService.oneDarrayOfSelectedObj;
    if (!objs.length || !objs[0].fill?.toString().length) return;
    if (typeof objs[0].fill === 'string') {
      return 'string';
    } else if (objs[0].fill instanceof fabric.Gradient) {
      return 'gradient';
    }
    return;
  }

  onColorStopSelected(stop: ColorStop) {
    // console.log(stop);
    this.gradientColorStopIndex = stop.index;
  }

  onColorStopSelectionUpdate(stop: ColorStop) {
    // console.log(stop);
    this.gradientColorStopIndex = stop.index;
  }
  onColorStopMoving(stop: ColorStop) {
    const fill = (
      this.canvasService.oneDarrayOfSelectedObj[0].fill as fabric.Gradient
    ).toObject() as IncludePropertiesOnly<fabric.Gradient>;

    // const grad = obj.fill as fabric.Gradient;
    fill.colorStops![stop.index].offset = stop.offset;
    const grad = new fabric.Gradient({
      ...fill,
    });
    this.setCurrentColor(grad);
  }
  onColorStopModified(stop: ColorStop) {
    // console.log(stop);
  }
  onColorStopSelectionCleared() {
    this.gradientColorStopIndex = null;
  }

  fillPlaneColor() {
    if (this.fillColorFormateType == 'string') return;
    if (this.colorCatch && typeof this.colorCatch == 'string') {
      this.setCurrentColor(this.colorCatch);
    } else {
      this.setCurrentColor('#07a4b0');
    }
    this.colorCatch = this.canvasService.oneDarrayOfSelectedObj[0].fill || null;
    // this.palette.lastMousePo = null;
    // this.hueSlider.lastMousePo = null;
    // this.gradientColorStopIndex = null;
  }

  fillGradientColor() {
    if (this.fillColorFormateType == 'gradient') return;
    if (this.colorCatch && this.colorCatch instanceof fabric.Gradient) {
      this.setCurrentColor(this.colorCatch);
    } else {
      const grad = new fabric.Gradient({
        type: 'linear',
        gradientUnits: 'pixels', // or 'percentage'
        coords: {
          x1: 0,
          y1: 0,
          x2: this.canvasService.oneDarrayOfSelectedObj[0].width || 100,
          y2: 0,
        },
        colorStops: [
          { offset: 0, color: '#000' },
          { offset: 1, color: '#fff' },
        ],
      });
      this.setCurrentColor(grad);
    }
    this.colorCatch = this.canvasService.oneDarrayOfSelectedObj[0].fill || null;
    // this.palette.lastMousePo = null;
    // this.hueSlider.lastMousePo = null;
    // this.gradientColorStopIndex = null;
  }

 
  setCurrentColor(color: string | fabric.Gradient) {
    if (color instanceof fabric.Gradient) {
      this.onColorChnage.emit(color);
    } else {
      this.onColorChnage.emit(Color(color).hex());
    }
   
  }

  

  get gradient() {
    if (this.fillColorFormateType == 'gradient') {
      return this.canvasService.oneDarrayOfSelectedObj[0]
        .fill as fabric.Gradient;
    }
    return null;
  }

  get isColorContainerVisible() {
    return (
      this.targetNameToColor != 'fill' ||
      this.fillColorFormateType == 'string' ||
      (this.fillColorFormateType == 'gradient' &&
        this.gradientColorStopIndex != null)
    );
  }
}
