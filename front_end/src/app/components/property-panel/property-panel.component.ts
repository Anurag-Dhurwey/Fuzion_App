import { Component } from '@angular/core';
import { CommomComponent } from './commom/commom.component';
import { CanvasService } from '../../services/canvas/canvas.service';
// import { QuadraticCurveControlPoint } from '../../../types/app.types';

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
    this.canvasService.updateObjects(
      [...this.canvasService.oneDarrayOfSelectedObj],
      'delete'
    );
  }



  // isActiveObjMutable() {
  //   if (
  //     this.canvasService.oneDarrayOfObjects.length > 1 &&
  //     !(this.canvasService.activeObjects as QuadraticCurveControlPoint).ctrlOf
  //   ) {
  //     return true;
  //   } else {
  //     return false;
  //   }
  // }

  // title() {
  //   return this.canvasService.oneDarrayOfSelectedObj.length > 1
  //     ? 'Group'
  //     : this.canvasService.oneDarrayOfSelectedObj[0].type;
  // }
}
