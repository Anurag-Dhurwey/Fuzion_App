import { Component } from '@angular/core';
import { CommomComponent } from './commom/commom.component';
import { CanvasService } from '../../services/canvas/canvas.service';
import { EditPathComponent } from './edit-path/edit-path.component';
import { ColorPickerComponent } from '../color-picker/color-picker.component';
// import { Fab_Objects } from '../../../types/app.types';
// import { QuadraticCurveControlPoint } from '../../../types/app.types';
import { fabric } from 'fabric';
@Component({
  selector: 'app-property-panel',
  standalone: true,
  imports: [CommomComponent, EditPathComponent, ColorPickerComponent],
  templateUrl: './property-panel.component.html',
  styleUrl: './property-panel.component.css',
})
export class PropertyPanelComponent {
  constructor(public canvasService: CanvasService) {}

  showColorPicker = false;
  targetNameToColor: keyof fabric.Object | null = null;

  // gradientColorStopIndex: number | null = null;

  // get colorPreset() {
  //   return [
  //     ...this.canvasService.existingColorsPreset(this.canvasService.objects),
  //   ];
  // }
  ngAfterViewInit() {
    this.canvasService.canvas?.on('selection:cleared', () => {
      this.closeColorPicker();
    });
    this.canvasService.canvas?.on('selection:updated', () => {
      this.closeColorPicker();
    });
  }

  onDeleteClick() {
    this.canvasService.updateObjects(
      [...this.canvasService.oneDarrayOfSelectedObj],
      'delete'
    );
  }

  onInputClick(event: MouseEvent) {
    const target = event.target as HTMLInputElement;
    if (target.type === 'color') {
      event.preventDefault();
      this.targetNameToColor = target.name as keyof fabric.Object;
      this.showColorPicker = true;
    }
  }
  onColorChange(val: string|fabric.Gradient) {
    if (!this.targetNameToColor) return;
    (this.canvasService.oneDarrayOfSelectedObj[0] as fabric.Object).set(
      this.targetNameToColor,
      val
    );
    // this.canvasService.canvas?.renderAll();
    this.canvasService.canvas?.requestRenderAll();
    // this.canvasService.em
  }

  get getEleWidth() {
    const ele = document.getElementById('propertyBar') as HTMLDivElement;
    return ele.getBoundingClientRect().width || 300;
  }

  closeColorPicker() {
    this.showColorPicker = false;
    this.targetNameToColor = null;

    // this.gradientColorStopIndex=null
  }

  // get color() {
  //   const objs = this.canvasService.oneDarrayOfSelectedObj;
  //   if (!objs.length || !objs[0].fill?.toString().length) return;
  //   if (typeof objs[0].fill === 'string') {
  //     return objs[0].fill;
  //   } else if (
  //     objs[0].fill instanceof fabric.Gradient &&
  //     this.gradientColorStopIndex != null
  //   ) {
  //     return objs[0].fill.colorStops![this.gradientColorStopIndex].color;
  //   }
  //   return;
  // }

  // get fillColorFormateType() {
  //   const objs = this.canvasService.oneDarrayOfSelectedObj;
  //   if (!objs.length || !objs[0].fill?.toString().length) return;
  //   if (typeof objs[0].fill === 'string') {
  //     return 'string';
  //   } else if (objs[0].fill instanceof fabric.Gradient) {
  //     return 'gradient';
  //   }
  //   return;
  // }

  // onNgxPickerClose() {
  //   this.showColorPicker = false;
  // }
}
