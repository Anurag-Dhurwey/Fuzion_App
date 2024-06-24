import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Fab_Objects, Position } from '../../../../types/app.types';
import { CanvasService } from '../../../services/canvas/canvas.service';

@Component({
  selector: 'app-layer-panel-context-menu',
  standalone: true,
  imports: [],
  templateUrl: './layer-panel-context-menu.component.html',
  styleUrl: './layer-panel-context-menu.component.css',
})
export class LayerPanelContextMenuComponent {
  @Input({ required: true }) position: Position | undefined | null;
  @Input({ required: true }) object: Fab_Objects | undefined;
  @Output() onGroup = new EventEmitter();
  constructor(public canvasService: CanvasService) {}

  onDeleteClick() {
    this.canvasService.updateObjects(
      this.canvasService.oneDarrayOfSelectedObj,
      'delete'
    );
    this.object && this.canvasService.updateObjects(this.object, 'delete');
  }
}
