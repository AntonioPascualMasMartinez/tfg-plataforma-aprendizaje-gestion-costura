import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const guestGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('accessToken');

    if (token) {
      // Si ya está logueado, lo mandamos a su home
      router.navigate(['/home']);
      return false;
    }
  }

  return true; // Si es un visitante, le dejamos ver el login/landing
};
