import { Component } from '@angular/core';
import { CommomComponent } from './commom/commom.component';
import { CanvasService } from '../../services/canvas/canvas.service';

@Component({
  selector: 'app-property-panel',
  standalone: true,
  imports: [CommomComponent],
  templateUrl: './property-panel.component.html',
  styleUrl: './property-panel.component.css',
})
export class PropertyPanelComponent {
  constructor(public canvasService: CanvasService) {}

  onDeleteClick() {
    this.canvasService.updateObjects([
      ...this.canvasService.selectedObj
    ],'delete');
  }

  ngAfterViewInit() {
  }
}
