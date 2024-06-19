import { Component } from '@angular/core';
import { CommomComponent } from './commom/commom.component';
import { CanvasService } from '../../services/canvas/canvas.service';
import { EditPathComponent } from './edit-path/edit-path.component';
import { ColorPickerComponent } from '../color-picker/color-picker.component';
// import { Fab_Objects } from '../../../types/app.types';
// import { QuadraticCurveControlPoint } from '../../../types/app.types';

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
  colorPickerTargetName: keyof fabric.Object | null = null;


  ngAfterViewInit(){
    this.canvasService.canvas?.on('selection:cleared',()=>{
      this.closeColorPicker()
    })
    this.canvasService.canvas?.on('selection:updated',()=>{
      this.closeColorPicker()
    })
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
      this.colorPickerTargetName = target.name as keyof fabric.Object;
      this.showColorPicker = true;
    }
  }
  onColorChange(val: string) {
    if (!this.colorPickerTargetName) return;
    (this.canvasService.oneDarrayOfSelectedObj[0] as fabric.Object).set(
      this.colorPickerTargetName,
      val
    );
    this.canvasService.canvas?.renderAll();
  }

  get getEleWidth() {
    const ele = document.getElementById('propertyBar') as HTMLDivElement;
    return ele.getBoundingClientRect().width || 300;
  }

  closeColorPicker() {
    this.showColorPicker = false;
    this.colorPickerTargetName = null;
  }
 
  // onNgxPickerClose() {
  //   this.showColorPicker = false;
  // }
}
