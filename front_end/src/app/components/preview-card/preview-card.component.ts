import { Component, Input, OnInit } from '@angular/core';
import { Fab_Objects, Project } from '../../../types/app.types';
import { fabric } from 'fabric';
import { v4 } from 'uuid';
import { RouterLink } from '@angular/router';
import { DbService } from '../../services/db/db.service';
import { AuthService } from '../../services/auth/auth.service';
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
  @Input() dimension: { width: number; height: number } = {
    width: 250,
    height: 150,
  };
  @Input() admin_controls: boolean = false;
  canvas: fabric.Canvas | undefined;

  constructor(private _dbService: DbService, public authService: AuthService) {}
  ngOnInit(): void {}
  ngAfterViewInit(): void {
    const board = document.getElementById(this.id) as HTMLCanvasElement;
    board.width = this.dimension.width;
    board.height = this.dimension.height;
    this.canvas = new fabric.Canvas(board, {
      backgroundColor: 'dimgray',
      selection: false,
      skipTargetFind: true,
      defaultCursor: 'pointer',
      allowTouchScrolling: false,
    });

    if (this.project?.objects && typeof this.project.objects === 'string') {
      fabric.util.enlivenObjects(
        JSON.parse(this.project.objects),
        (live: any) => {
          live?.forEach((obj: Fab_Objects) => {
            const scalY = this.dimension.height / this.project!.height;
            const scalX = this.dimension.width / this.project!.width;
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
  deleteProject() {
    this._dbService.deleteProject(this.id);
  }

  markPromotional() {
    if (!this.project) return;
    this._dbService.togglePromotional(this.project);
  }
}
