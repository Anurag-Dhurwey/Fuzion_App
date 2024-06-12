import { Component } from '@angular/core';
import { CanvasService } from '../../../services/canvas/canvas.service';
import { Fab_Path, Fab_PathArray, Keys } from '../../../../types/app.types';

@Component({
  selector: 'app-edit-path',
  standalone: true,
  imports: [],
  templateUrl: './edit-path.component.html',
  styleUrl: './edit-path.component.css',
})
export class EditPathComponent {
  constructor(private canvasService: CanvasService) {}

  editPthFields: {
    title: string;
    keys: {
      lable: string;
      // emit: () => void;
      inputType: 'button' | 'checkbox';
      name: Name;
    }[];
  }[] = [
    {
      title: 'Path',
      keys: [
        {
          lable: 'Clip start and end',
          // emit: this.clipStartEndPoint,
          inputType: 'checkbox',
          name: 'Clip_start_and_end',
        },
        {
          lable: 'Join start and end',
          // emit: this.joinStartEndPoint,
          inputType: 'button',
          name: 'Join_start_and_end',
        },

        {
          lable: 'Move start at end',
          // emit: this.placeStartAtEnd,
          inputType: 'button',
          name: 'Move_start_at_end',
        },
        {
          lable: 'Move end at start',
          // emit: this.placeEndAtStart,
          inputType: 'button',
          name: 'Move_end_at_start',
        },
      ],
    },
  ];


  get editingPath() {
    return this.canvasService.editingPath as Fab_Path;
  }

  close(){
    this.canvasService.removeQuadraticCurveControlPoints()
  }

  onInput(target: any) {
    const name = target.name as Name;
    if (name == 'Clip_start_and_end') {
      this.clipStartEndPoint();
    } else if (name == 'Join_start_and_end') {
      this.joinStartEndPoint();
    } else if (name == 'Move_start_at_end') {
      this.placeStartAtEnd();
    } else if (name == 'Move_end_at_start') {
      this.placeEndAtStart();
    }
  }

  clipStartEndPoint() {
    if (!this.canvasService.editingPath) return;
    this.canvasService.editingPath.clipStartEndPoint = !this.canvasService.editingPath.clipStartEndPoint;
    // this.replacePath();
  }

  joinStartEndPoint() {
    if (!this.canvasService.editingPath) return;
    const toEdit = this.canvasService.editingPath
      .path as unknown as Fab_PathArray[];
    if (
      toEdit[0][1] == toEdit[toEdit.length - 1][3] &&
      toEdit[0][2] == toEdit[toEdit.length - 1][4]
    ) {
      return;
    }
    //  const toEdit =  this.canvasService.editingPath.path as unknown as (number )[][];
    if (toEdit) {
      const midX =
        toEdit[0][1] -
        (toEdit[0][1] -
          (toEdit[toEdit.length - 1][toEdit.length == 1 ? 1 : 3] as number)) /
          2;
      const midY =
        toEdit[0][2] -
        (toEdit[0][2] -
          (toEdit[toEdit.length - 1][toEdit.length == 1 ? 2 : 4] as number)) /
          2;
      toEdit.push(['Q', midX, midY, toEdit[0][1], toEdit[0][2]]);
      this.canvasService.editingPath.set('path', toEdit as any[]);
      this.replacePath();
    }
  }

  placeStartAtEnd() {
    if (!this.canvasService.editingPath?.path) return;
    const toEdit = this.canvasService.editingPath
      .path as unknown as Fab_PathArray[];
    if (
      toEdit[0][1] == toEdit[toEdit.length - 1][3] &&
      toEdit[0][2] == toEdit[toEdit.length - 1][4]
    ) {
      return;
    }
    const start = (
      this.canvasService.editingPath.path as unknown as Fab_PathArray[]
    )[0];
    const end = (
      this.canvasService.editingPath.path as unknown as Fab_PathArray[]
    )[this.canvasService.editingPath.path.length - 1];
    if (start && end) {
      start[1] = end[3];
      start[2] = end[4];
      this.replacePath();
    }
  }
  placeEndAtStart() {
    if (!this.canvasService.editingPath?.path) return;
    const toEdit = this.canvasService.editingPath
      .path as unknown as Fab_PathArray[];
    if (
      toEdit[0][1] == toEdit[toEdit.length - 1][3] &&
      toEdit[0][2] == toEdit[toEdit.length - 1][4]
    ) {
      return;
    }
    const start = (
      this.canvasService.editingPath.path as unknown as Fab_PathArray[]
    )[0];
    const end = (
      this.canvasService.editingPath.path as unknown as Fab_PathArray[]
    )[this.canvasService.editingPath.path.length - 1];
    if (start && end) {
      end[3] = end[1];
      end[4] = end[2];
      this.replacePath();
    }
  }

  replacePath() {
    console.log('got');
    if (!this.canvasService.editingPath) return;
    // const path=   this.canvasService.editingPath.path as unknown as Fab_PathArray
    // if(path){
    this.canvasService.loadSVGFromString(
      this.canvasService.editingPath,
      {
        _id: this.canvasService.editingPath._id,
        pathType: this.canvasService.editingPath.pathType,
        clipStartEndPoint: this.canvasService.editingPath.clipStartEndPoint,
        name:this.canvasService.editingPath.name||'path'
      },
      'replace'
    );
    this.canvasService.quadraticCurveControlPoints.forEach((point) =>
      this.canvasService.canvas?.bringToFront(point)
    );
    // }
  }
}

type Name =
  | 'Clip_start_and_end'
  | 'Join_start_and_end'
  | 'Move_start_at_end'
  | 'Move_end_at_start';
