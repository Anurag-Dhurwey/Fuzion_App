import { Component, OnInit } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { DbService } from '../../services/db/db.service';
import { AuthService } from '../../services/auth/auth.service';
import { CanvasService } from '../../services/canvas/canvas.service';
import { PreviewCardComponent } from '../preview-card/preview-card.component';
@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [RouterOutlet, RouterLinkActive, RouterLink, PreviewCardComponent],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css',
})
export class WelcomeComponent implements OnInit {
  constructor(
    public authService: AuthService,
    private router: Router,
    public canvasService: CanvasService,
    public dbService: DbService
  ) {}

  async ngOnInit() {
    try {
      await this.dbService.getPromotional_projects();
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
      const id = await this.dbService.createProject(
        this.canvasService.frame.x,
        this.canvasService.frame.y
      );
      this.router.navigate([`/canvas/${id}`]);
    } catch (error) {
      console.error(error);
    }
  }
}
