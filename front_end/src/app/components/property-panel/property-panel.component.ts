import { Component } from '@angular/core';
import { CommomComponent } from './commom/commom.component';
import { CanvasService } from '../../services/canvas/canvas.service';
import { EditPathComponent } from './edit-path/edit-path.component';
import { ColorPickerComponent } from '../color-picker/color-picker.component';
import { fabric } from 'fabric';
import { SocketService } from '../../services/socket/socket.service';
@Component({
  selector: 'app-property-panel',
  standalone: true,
  imports: [CommomComponent, EditPathComponent, ColorPickerComponent],
  templateUrl: './property-panel.component.html',
  styleUrl: './property-panel.component.css',
})
export class PropertyPanelComponent {
  constructor(
    public canvasService: CanvasService,
    private socketService: SocketService
  ) {}

  showColorPicker = false;
  targetNameToColor: keyof fabric.Object | null = null;

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
  onColorChange(val: string | fabric.Gradient) {
    if (!this.targetNameToColor) return;
    (this.canvasService.oneDarrayOfSelectedObj[0] as fabric.Object).set(
      this.targetNameToColor,
      val
    );
    this.canvasService.canvas?.requestRenderAll();
    if (this.socketService.setting.continuous_broadcasting) {
      this.canvasService.socketEvents.object_modified('replace',true);
    }
  }

  get getEleWidth() {
    const ele = document.getElementById('propertyBar') as HTMLDivElement;
    return ele.getBoundingClientRect().width || 300;
  }

  closeColorPicker() {
    this.showColorPicker = false;
    this.targetNameToColor = null;
  }
}
