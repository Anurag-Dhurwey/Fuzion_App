import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, ReactiveFormsModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css',
})
export class SignUpComponent {
  constructor(public authService: AuthService, private router: Router) {}

  email = new FormControl('');
  password = new FormControl('');
  error: string = '';
  async signUp(e: SubmitEvent) {
    e.preventDefault();
    if (!this.email.value || !this.password.value) {
      this.error = 'all fields are required';
      return;
    }
    try {
      await this.authService.signUp(this.email.value, this.password.value);
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.error = `${error.message}`;
    }
  }
}
