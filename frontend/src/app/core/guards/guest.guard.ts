/**
 * @file guest.guard.ts
 * @description Guardián de rutas (Guard) inverso, diseñado para gestionar el acceso de usuarios no autenticados (invitados).
 * Previene que usuarios con una sesión activa accedan inadvertidamente a interfaces públicas como el inicio de sesión o registro.
 */
import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const guestGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('accessToken');

    if (token) {
      /* Recuperación de la URL previa almacenada en los parámetros de consulta,
         estableciendo el módulo central del sistema como ruta de contingencia por defecto. */
      const returnUrl = route.queryParams['returnUrl'] || '/home/inicio';

      return router.createUrlTree([returnUrl]);
    }
  }

  /* Permite el acceso a la ruta pública si no existe sesión o la evaluación se realiza desde el servidor (SSR) */
  return true;
};
