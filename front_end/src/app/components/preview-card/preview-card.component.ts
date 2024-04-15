import { Component, Input, OnInit } from '@angular/core';
import { Object, project } from '../../../types/app.types';
import { fabric } from 'fabric';
import { v4 } from 'uuid';
@Component({
  selector: 'app-preview-card',
  standalone: true,
  imports: [],
  templateUrl: './preview-card.component.html',
  styleUrl: './preview-card.component.css',
})
export class PreviewCardComponent implements OnInit {
  @Input() objects: project | undefined;
  @Input() id: string = v4();
  @Input() dimension: { width: number; height: number } = {
    width: 250,
    height: 150,
  };
  canvas: fabric.Canvas | undefined;

  constructor() {}
  ngOnInit(): void {}
  ngAfterViewInit(): void {
    const board = document.getElementById(this.id) as HTMLCanvasElement;
    board.width = this.dimension.width;
    board.height = this.dimension.height;
    this.canvas = new fabric.Canvas(board, {
      backgroundColor: 'dimgray',
      selection: false,
      skipTargetFind:true
    });

    if (this.objects?.objects && typeof this.objects.objects === 'string') {
      fabric.util.enlivenObjects(
        JSON.parse(this.objects.objects),
        (live: any) => {
          live?.forEach((obj: Object) => {
            const scalY = this.dimension.height / window.innerHeight;
            const scalX = this.dimension.width / window.innerWidth;
            obj.scaleToHeight(this.dimension.height * scalY);
            obj.scaleToWidth(this.dimension.width * scalX);
            obj.left = obj.left! * scalX;
            obj.top = obj.top! * scalY;
            this.canvas?.add(obj);
            this.canvas?.renderAll();
          });
        },
        'fabric'
      );
    }

  }
  test() {
    console.log(this.canvas?.toObject());
  }
}
