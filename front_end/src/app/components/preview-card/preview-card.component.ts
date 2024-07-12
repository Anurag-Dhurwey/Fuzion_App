import { Component, HostListener, Input, OnInit } from '@angular/core';
import { Project } from '../../../types/app.types';
import { v4 } from 'uuid';
import { RouterLink } from '@angular/router';
import { DbService } from '../../services/db/db.service';
import { AuthService } from '../../services/auth/auth.service';
import { CanvasService } from '../../services/canvas/canvas.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-preview-card',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './preview-card.component.html',
  styleUrl: './preview-card.component.css',
})
export class PreviewCardComponent implements OnInit {
  @Input({ required: true }) project: Project | undefined;
  @Input({ required: true }) id: string = v4();
  @Input() admin_controls: boolean = false;

  _imageToPreview = '';

  renameProjectForm: { name: string; id: string } | null = null;

  @HostListener('window:keydown', ['$event'])
  keyDown(event: KeyboardEvent) {
    if (this.renameProjectForm) {
      if (['Escape', 'Tab', 'Enter'].includes(event.key)) {
        this.saveAndExitRenameProjectForm();
      }
    }
  }
  constructor(private _dbService: DbService, public authService: AuthService) {}

  onProjectRename(name: string) {
    console.log(name);
    if (!this.renameProjectForm) return;
    this.renameProjectForm.name = name;
  }

  onDblClickAtProjectName() {
    if (!this.admin_controls || !this.project) return;

    this.renameProjectForm = {
      name: this.project.name,
      id: this.project.id,
    };
  }

  saveAndExitRenameProjectForm() {
    if (!this.renameProjectForm?.name.length) return;
    if (this.renameProjectForm) {
      this._dbService.renameProjectById(
        this.renameProjectForm.name,
        this.renameProjectForm.id
      );
    }
    this.renameProjectForm = null;
  }

  async ngOnInit() {
    if (!this.project) return;
    this._imageToPreview = await this._dbService.previewProjectImage(
      this.project.id
    );

    // CanvasService.getImageData(this.project, (imgData) => {
    //   this._imageToPreview = imgData;
    // });
  }

  deleteProject() {
    this._dbService.deleteProject(this.id);
  }

  markPromotional() {
    if (!this.project) return;
    this._dbService.togglePromotional(this.project);
  }
}
