import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Position } from '../../../../types/app.types';
import { CanvasService } from '../../../services/canvas/canvas.service';

@Component({
  selector: 'app-layer-panel-context-menu',
  standalone: true,
  imports: [],
  templateUrl: './layer-panel-context-menu.component.html',
  styleUrl: './layer-panel-context-menu.component.css',
})
export class LayerPanelContextMenuComponent {
  @Input() position: Position | undefined | null;
  @Input() object: Object | undefined;
  @Output() onGroup = new EventEmitter();
  constructor(public canvasService: CanvasService) {}

  onDeleteClick() {
    this.canvasService.filterObjectsByIds(this.canvasService.idsOfSelectedObj);
  }
}
