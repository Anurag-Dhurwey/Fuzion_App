import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (['/dashboard'].includes(state.url)) {
    if (authService.auth.currentUser) {
      return true;
    }
    router.navigate(['/sign-in']);
    return false;
  } else if (['/sign-in', '/sign-up'].includes(state.url)) {
    if (authService.auth.currentUser) {
      router.navigate(['/dashboard']);
      return false;
    }
    return true;
  } else {
    console.log(state.url);
    console.error('no route match in auth guard');
    return false;
  }
};
