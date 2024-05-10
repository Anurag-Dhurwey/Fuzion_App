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
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLinkActive,
    RouterLink,
    PreviewCardComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  // projects: Project[] = [];
  // app$: appState | undefined;
  // private store = inject(Store);
  // demo_projects: Project[] = [];
  projectType = 'my';
  constructor(
    public authService: AuthService,
    private router: Router,
    public dbService: DbService
  ) {
    // this.store.select(appSelector).subscribe((state) => (this.app$ = state));
  }

  // folders: (folder | file)[] = [
  //   { type: 'file', data: '123' },
  //   { type: 'file', data: '123' },
  //   { type: 'file', data: '123' },
  //   {
  //     type: 'folder',
  //     data: [
  //       { type: 'file', data: '123' },
  //       { type: 'file', data: '123' },
  //       { type: 'folder', data: [{ type: 'file', data: '123' }] },
  //     ],
  //   },
  // ];

  async ngOnInit() {
    if (!this.dbService.projects.length) {
      const projects = await this.dbService.getProjects();
      console.log(projects);
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
   await this.dbService.getDemoProjects()
  }
}

type file = { type: 'file'; data: any };
type folder = { type: 'folder'; data: (file | folder)[] };
