import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, ReactiveFormsModule],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css',
})
export class SignInComponent {
  constructor(public authService: AuthService, private router: Router) {}
  email = new FormControl('');
  password = new FormControl('');
  error: string = '';

  async signIn(e: SubmitEvent) {
    e.preventDefault();
    if (!this.email.value || !this.password.value) {
      this.error = 'all fields are required';
      return;
    }
    try {
      await this.authService.signIn(this.email.value, this.password.value);
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.error = `${error.message}`;
    }
  }
}
