import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // Solo comprobamos el token si estamos en el entorno del navegador
  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('accessToken');

    if (token) {
      return true; // Permite el paso
    }
  }

  // Si no hay token, o estamos en el servidor, bloqueamos y al login
  router.navigate(['/auth/login']);
  return false;
};
