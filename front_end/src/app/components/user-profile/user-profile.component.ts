import { Component } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLinkActive,
    RouterLink,],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css',
})
export class UserProfileComponent {
  constructor(public authService: AuthService, private router: Router) {}
  async signOut() {
    try {
      await this.authService.signOutUser();
      this.router.navigate(['/sign-in']);
    } catch (error) {}
  }
}
