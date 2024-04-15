import { Component, OnInit} from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLinkActive, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'fabric app';
  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.whenAuthStateChange((user) => {
      if (user) {
        this.router.navigate(['/dashboard']);
      } else {
        this.router.navigate(['/welcome']);
      }
    });
  }
}
