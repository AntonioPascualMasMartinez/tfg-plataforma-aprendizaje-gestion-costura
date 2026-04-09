/**
 * @file admin.guard.ts
 * @description Guardián de rutas (Guard) de Angular para la verificación de privilegios de administrador.
 * Implementa la interfaz CanActivateFn para proteger rutas específicas, asegurando que el usuario
 * esté autenticado y posea el rol 'Admin' mediante la decodificación de su JSON Web Token (JWT).
 * Incorpora validación de plataforma para su correcta ejecución en entornos de Server-Side Rendering (SSR).
 */
import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { jwtDecode } from 'jwt-decode';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  /* Verificación exclusiva en el entorno del cliente (navegador) para acceder al almacenamiento local */
  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('accessToken');

    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        if (decodedToken.role === 'Admin') {
          return true;
        }
      } catch (error) {
        console.error('Error durante la decodificación del token de acceso:', error);
      }
    }
  }

  /* Redirección al formulario de autenticación si la validación falla o se ejecuta en el servidor,
     preservando la URL de origen para asegurar una experiencia de usuario ininterrumpida. */
  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url },
  });
};