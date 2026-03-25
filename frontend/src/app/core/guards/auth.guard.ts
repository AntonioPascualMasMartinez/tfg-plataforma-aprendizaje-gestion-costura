import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // 1. Si estamos en el navegador y hay token, pasa sin problema
  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('accessToken');
    if (token) {
      return true;
    }
  }

  // 2. Si no hay token O estamos en el servidor (SSR):
  // Redirigimos al login, pero guardamos la URL a la que quería ir (ej. /home/tutoriales)
  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url },
  });
};
