import { Component } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BaseLayoutComponent } from '../wrapper/base-layout/base-layout.component';
import { SideSectionComponent } from '../side-section/side-section.component';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLinkActive,
    RouterLink,BaseLayoutComponent,SideSectionComponent],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css',
})
export class UserProfileComponent {
  constructor(public authService: AuthService, private router: Router) {}
  sideSectionData = [
    { icon: 'dashboard', route: '/dashboard' },
    { icon: 'home', route: '/welcome' },
  ];

  async signOut() {
    try {
      await this.authService.signOutUser();
      this.router.navigate(['/sign-in']);
    } catch (error) {}
  }
}
