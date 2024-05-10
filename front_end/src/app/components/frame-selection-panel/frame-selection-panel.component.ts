import { Component } from '@angular/core';
import { CanvasService } from '../../services/canvas/canvas.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-frame-selection-panel',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './frame-selection-panel.component.html',
  styleUrl: './frame-selection-panel.component.css',
})
export class FrameSelectionPanelComponent {
  constructor(public _canvasService: CanvasService) {}
  x = new FormControl<number>(this._canvasService.frame.x||1920);
  y = new FormControl<number>(this._canvasService.frame.y||1080);
  applyFrame() {
    if (!this.x.value || !this.y.value) return;
    this._canvasService.frame = { x: this.x.value, y: this.y.value };
    this._canvasService.canvas?.setWidth(this.x.value*this._canvasService.zoom);
    this._canvasService.canvas?.setHeight(this.y.value*this._canvasService.zoom);
    this._canvasService.canvas?.forEachObject((obj) => {
      obj.setCoords();
    });
    this._canvasService.canvas?.requestRenderAll();
    this._canvasService.layout.visibility.frame_selection_panel = false;
  }
}
