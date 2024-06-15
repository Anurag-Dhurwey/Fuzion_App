import { Component, Input, OnInit } from '@angular/core';
import { Fab_Objects, Project } from '../../../types/app.types';
import { fabric } from 'fabric';
import { v4 } from 'uuid';
import { RouterLink } from '@angular/router';
import { DbService } from '../../services/db/db.service';
import { AuthService } from '../../services/auth/auth.service';
import { CanvasService } from '../../services/canvas/canvas.service';
@Component({
  selector: 'app-preview-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './preview-card.component.html',
  styleUrl: './preview-card.component.css',
})
export class PreviewCardComponent implements OnInit {
  @Input() project: Project | undefined;
  @Input() id: string = v4();
  // @Input() dimension: { width: number; height: number } = {
  //   width: 250,
  //   height: 150,
  // };
  @Input() admin_controls: boolean = false;
  // canvas: fabric.Canvas | undefined;

  _imageToPreview: string = '';

  constructor(
    private _dbService: DbService,
    public authService: AuthService,
    private canvasService: CanvasService
  ) {}
  ngOnInit(): void {}
  ngAfterViewInit(): void {
    if (!this.project) return;
    // const board = document.getElementById(this.id) as HTMLCanvasElement;
    const board = document.createElement('canvas');
    board.width = this.project.width;
    board.height = this.project.height;
    const canvas = new fabric.StaticCanvas(board, {});

    if (this.project?.objects && typeof this.project.objects === 'string') {
      fabric.util.enlivenObjects(
        JSON.parse(this.project.objects),
        (live: any) => {
          live?.forEach((obj: Fab_Objects) => {
            if (obj.type === 'group') {
              this.canvasService
                .filterSelectableObjectsFromGroup(obj)
                .forEach((ob) => canvas.add(ob));
            } else {
              canvas?.add(obj);
            }
          });
          // canvas?.add(live);
          canvas?.requestRenderAll();
          const src = canvas.toDataURL({ format: 'png' });
          this.seImageToPreview(src);
        },
        'fabric'
      );
    }
  }

  get imageToPreview() {
    return this._imageToPreview;
  }

  deleteProject() {
    this._dbService.deleteProject(this.id);
  }

  seImageToPreview(src: string) {
    this._imageToPreview = src;
  }

  markPromotional() {
    if (!this.project) return;
    this._dbService.togglePromotional(this.project);
  }
}
