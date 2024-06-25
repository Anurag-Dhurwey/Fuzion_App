import { Component, EventEmitter, Input, Output } from '@angular/core';
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
    this.canvasService.socketEvents.object_modified('replace',true);
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
    this.canvasService.saveStateInHistory();
    this.canvasService.socketEvents.object_modified('replace');
  }

  linearGradient() {
    return new fabric.Gradient({
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
  }

  radialGradient(width: number, height: number) {
    return new fabric.Gradient({
      type: 'radial',
      gradientUnits: 'pixels', // or 'percentage'
      coords: {
        x1: Math.floor(width / 2),
        y1: Math.floor(height / 2),
        x2: Math.floor(width / 2),
        y2: Math.floor(height / 2),
        r1: Math.floor(1),
        r2: Math.floor(width),
      },
      colorStops: [
        { offset: 0, color: '#FF0B89' },

        // { offset: 0.5, color: "violet" },
        { offset: 1, color: 'rgba(11, 147, 255, 0.15)' },
      ],
    });
  }

  fillGradientColor() {
    if (this.fillColorFormateType == 'gradient') return;
    if (this.colorCatch && this.colorCatch instanceof fabric.Gradient) {
      this.setCurrentColor(this.colorCatch);
    } else {
      this.setCurrentColor(this.linearGradient());
    }
    this.colorCatch = this.canvasService.oneDarrayOfSelectedObj[0].fill || null;
    // this.palette.lastMousePo = null;
    // this.hueSlider.lastMousePo = null;
    // this.gradientColorStopIndex = null;
    this.canvasService.saveStateInHistory();
    this.canvasService.socketEvents.object_modified('replace');
  }
  onChangeGradientType(val: string) {
    if (val == 'radial') {
      this.setCurrentColor(
        this.radialGradient(
          this.canvasService.oneDarrayOfSelectedObj[0].width!,
          this.canvasService.oneDarrayOfSelectedObj[0].height!
        )
      );
    } else if (val == 'linear') {
      this.setCurrentColor(this.linearGradient());
    }
    this.canvasService.socketEvents.object_modified('replace');
    this.canvasService.saveStateInHistory();
  }

  setCurrentColor(color: string | fabric.Gradient) {
    if (color instanceof fabric.Gradient) {
      this.onColorChnage.emit(color);
    } else {
      this.onColorChnage.emit(Color(color).hexa());
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
