import { Component, HostListener, Input, OnInit } from '@angular/core';
import { Object } from '../../../types/app.types';
import { LayerPanelContextMenuComponent } from './layer-panel-context-menu/layer-panel-context-menu.component';

import { CanvasService } from '../../services/canvas/canvas.service';
import { LayerService } from '../../services/layer/layer.service';

@Component({
  selector: 'app-layer-panel',
  standalone: true,
  imports: [LayerPanelContextMenuComponent],
  templateUrl: './layer-panel.component.html',
  styleUrl: './layer-panel.component.css',
})
export class LayerPanelComponent implements OnInit {
  @Input() projectId: string | null = null;
  @Input() layers: Object[] | undefined;
  @Input() group_id: string | null = null;
  constructor(
    public canvasService: CanvasService,
    public layerService: LayerService
  ) {}

  @HostListener('window:mouseup', ['$event'])
  mouseup(event: MouseEvent) {
    this.layerService.changeOrderIndex();
    this.layerService.changeOrder = null;
  }

  ngOnInit(): void {
    document.addEventListener('click', () => {
      this.layerService.context_menu = null;
    });
  }

  isEqualToChangeOrder_to(index: number, group_id: string | null) {
    return (
      this.layerService.changeOrder?.to?.group_id === group_id &&
      index === this.layerService.changeOrder.to.index
    );
  }
}
