import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const guestGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('accessToken');

    if (token) {
      // Miramos si la URL trae el parámetro de redirección
      // 'route' nos da acceso a los queryParams de la ruta a la que intentamos entrar
      const returnUrl = route.queryParams['returnUrl'] || '/home/inicio';

      // Lo mandamos a la ruta original (o a inicio si no había ninguna)
      return router.createUrlTree([returnUrl]);
    }
  }

  // Si no hay token o es el servidor, le dejamos ver la vista pública (login/landing)
  return true;
};
