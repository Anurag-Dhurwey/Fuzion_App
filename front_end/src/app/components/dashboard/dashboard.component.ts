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
import { FrameSelectionPanelComponent } from '../frame-selection-panel/frame-selection-panel.component';
import { CanvasService } from '../../services/canvas/canvas.service';
import { SideSectionComponent } from '../side-section/side-section.component';
import { BaseLayoutComponent } from '../wrapper/base-layout/base-layout.component';
import { CommonService } from '../../services/common/common.service';
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
    SideSectionComponent,
    BaseLayoutComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  creatingNewProject: boolean = false;

  constructor(
    public authService: AuthService,
    private router: Router,
    public dbService: DbService,
    public canvasService: CanvasService,
    public commonService: CommonService
  ) {}

  sideSectionData = [
    { icon: 'home', route: '/welcome' },
    { icon: 'account_circle', route: '/user-profile' },
  ];

  get myProject() {
    if (this.projectType == 'my') {
      return this.dbService.projects.filter((pro) => !pro.promotional);
    } else if (this.projectType == 'promotional') {
      return this.dbService.projects.filter((pro) => pro.promotional);
    } else {
      return [];
    }
  }

  async ngOnInit() {
    if (!this.dbService.projects.length) {
      await this.dbService.getProjects();
    }
  }

  async signOut() {
    try {
      await this.authService.signOutUser();
      this.router.navigate(['/sign-in']);
    } catch (error) {}
  }

  async createProject() {
    const id = await this.dbService.createProject(
      this.canvasService.frame.x,
      this.canvasService.frame.y
    );
    this.router.navigate([`/canvas/${id}`]);
  }

  onCancelFrameSelection() {
    this.creatingNewProject = false;
  }

  get projectType() {
    return this.commonService.dashboard_page.projectType;
  }
}

type file = { type: 'file'; data: any };
type folder = { type: 'folder'; data: (file | folder)[] };
