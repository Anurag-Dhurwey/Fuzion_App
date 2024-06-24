import { Component, Input, OnInit } from '@angular/core';
import { Project } from '../../../types/app.types';
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
  @Input({ required: true }) project: Project | undefined;
  @Input({ required: true }) id: string = v4();
  @Input() admin_controls: boolean = false;

  _imageToPreview: string = '';

  constructor(
    private _dbService: DbService,
    public authService: AuthService,
  ) {
  }
  ngOnInit(): void {
    this.project &&
      CanvasService.getImageData(this.project, (imgData) => {
        this._imageToPreview = imgData;
      });
  }
 

  deleteProject() {
    this._dbService.deleteProject(this.id);
  }



  markPromotional() {
    if (!this.project) return;
    this._dbService.togglePromotional(this.project);
  }
}
