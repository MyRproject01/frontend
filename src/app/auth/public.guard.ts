import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

export const publicGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    // If user is already logged in, redirect to main
    return router.parseUrl('/main');
  }

  // Allow access to login/register if not logged in
  return true;
};
