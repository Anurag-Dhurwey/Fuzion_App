import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { Fab_Objects } from '../../../types/app.types';
import { LayerPanelContextMenuComponent } from './layer-panel-context-menu/layer-panel-context-menu.component';

import { CanvasService } from '../../services/canvas/canvas.service';
import { LayerService } from '../../services/layer/layer.service';
// import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-layer-panel',
  standalone: true,
  imports: [LayerPanelContextMenuComponent],
  templateUrl: './layer-panel.component.html',
  styleUrl: './layer-panel.component.css',
})
export class LayerPanelComponent implements OnInit {
  @Input() projectId: string | null = null;
  @Input() layers: Fab_Objects[] | undefined;
  @Input() group_id: string | null = null;
  @Output() saveObjectsToDB = new EventEmitter<void>();

  // renaming:boolean=false

  // name=new FormControl('')

  constructor(
    public canvasService: CanvasService,
    public layerService: LayerService
  ) {}

  // onRename(name:Event){
  //   console.log('name',name.target)
  //   this.layerService.renameLayerForm!.name=(name.target as HTMLInputElement).value
  // }


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

  onDblClick(id: string, name?: string) {
    this.layerService.renameLayerForm = {
      layerId: id,
      name: name || '',
    };
  }
}
