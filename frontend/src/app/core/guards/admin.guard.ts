import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { jwtDecode } from 'jwt-decode';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // 1. Comprobamos si estamos en el navegador antes de tocar localStorage
  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('accessToken');

    if (token) {
      try {
        // Decodificamos el JWT para extraer el payload
        const decodedToken: any = jwtDecode(token);

        if (decodedToken.role === 'Admin') {
          return true; // Es administrador, pasa.
        }
      } catch (error) {
        console.error('Error decodificando el token:', error);
      }
    }
  }

  // 2. Si no es admin, el token es inválido, o estamos en el servidor (SSR), lo redirigimos
  router.navigate(['/profile']);
  return false;
};
