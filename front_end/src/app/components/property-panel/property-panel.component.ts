import { Component } from '@angular/core';
import { CommomComponent } from './commom/commom.component';
import { CanvasService } from '../../services/canvas/canvas.service';
import { EditPathComponent } from './edit-path/edit-path.component';
// import { QuadraticCurveControlPoint } from '../../../types/app.types';

@Component({
  selector: 'app-property-panel',
  standalone: true,
  imports: [CommomComponent,EditPathComponent],
  templateUrl: './property-panel.component.html',
  styleUrl: './property-panel.component.css',
})
export class PropertyPanelComponent {
  constructor(public canvasService: CanvasService) {}

  onDeleteClick() {
    this.canvasService.updateObjects(
      [...this.canvasService.oneDarrayOfSelectedObj],
      'delete'
    );
  }


  


}
