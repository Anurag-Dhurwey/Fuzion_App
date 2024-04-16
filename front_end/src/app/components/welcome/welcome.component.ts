import { Component, OnInit, inject } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { DbService } from '../../services/db/db.service';
import { AuthService } from '../../services/auth/auth.service';
import { appState } from '../../store/reducers/state.reducer';
import { Store } from '@ngrx/store';
import { appSelector } from '../../store/selectors/app.selector';
import { project } from '../../../types/app.types';
import { CanvasService } from '../../services/canvas/canvas.service';
import { fabric } from 'fabric';
import { PreviewCardComponent } from '../preview-card/preview-card.component';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [RouterOutlet, RouterLinkActive, RouterLink, PreviewCardComponent],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css',
})
export class WelcomeComponent implements OnInit {
  app$: appState | undefined;
  private store = inject(Store);
  demo_projects: project[] = [];

  constructor(
    public authService: AuthService,
    private router: Router,
    public canvasService: CanvasService,
    private dbService: DbService
  ) {
    this.store.select(appSelector).subscribe((state) => (this.app$ = state));
  }

  async ngOnInit() {
    try {
      this.demo_projects = (await this.dbService.getProjectsByIds([
        'R67bwQ8Dz03STMt1hfey',
        'K3cm1DyTLghMlIVDPj55',
      ])) as project[];
    } catch (error) {
      console.error(error);
    }

  }

  async signOut() {
    try {
      await this.authService.signOutUser();
      this.router.navigate(['/sign-in']);
    } catch (error) {
      console.error(error);
    }
  }

  async createProject() {
    try {
      const id = await this.dbService.createProject();
      this.router.navigate([`/canvas/${id}`]);
    } catch (error) {
      console.error(error);
    }
  }

  // initializeCanvases() {
  //   this.projects = this.projects?.map((objects) => {
  //     if (typeof objects.objects === 'string') {
  //       objects.objects =
  //         this.canvasService.enliveObjcts(JSON.parse(objects.objects), null) ||
  //         [];
  //     }
  //     return objects;
  //   });
  // }
}
