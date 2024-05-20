import { Component, OnInit } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth/auth.service';
import { DbService } from '../../services/db/db.service';
import { PreviewCardComponent } from '../preview-card/preview-card.component';
import { environment } from '../../../../environment';
import { FrameSelectionPanelComponent } from '../frame-selection-panel/frame-selection-panel.component';
import { CanvasService } from '../../services/canvas/canvas.service';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLinkActive,
    RouterLink,
    PreviewCardComponent,
    FrameSelectionPanelComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  creatingNewProject: boolean = false;
  projectType:'promotional'|'my' = 'my';
  constructor(
    public authService: AuthService,
    private router: Router,
    public dbService: DbService,
    public canvasService:CanvasService
  ) {
  }


  get myProject(){
    if(this.projectType=='my'){
      return this.dbService.projects.filter(pro=>!pro.promotional)
    }else if(this.projectType=='promotional'){
      return this.dbService.projects.filter(pro=>pro.promotional)
    } else{
      return []
    }
  }

  async ngOnInit() {
    if (!this.dbService.projects.length) {
      const projects = await this.dbService.getProjects();
    }
  }

  async signOut() {
    try {
      await this.authService.signOutUser();
      this.router.navigate(['/sign-in']);
    } catch (error) {}
  }

  async createProject() {
    const id = await this.dbService.createProject();
    this.router.navigate([`/canvas/${id}`]);
  }

  async onClickPromotionalTab() {
    // await this.dbService.getDemoProjects();
  }
}

type file = { type: 'file'; data: any };
type folder = { type: 'folder'; data: (file | folder)[] };
