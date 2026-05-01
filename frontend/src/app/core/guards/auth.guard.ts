/**
 * @file auth.guard.ts
 * @description Guardián de rutas (Guard) encargado de la autorización general de usuarios.
 * Restringe el acceso a las vistas protegidas del sistema comprobando la existencia de un
 * token de acceso en el almacenamiento local, adaptando su ejecución para evitar errores en SSR.
 */
import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const token = localStorage.getItem('accessToken');
  if (token) {
    return true;
  }

  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url },
  });
};
