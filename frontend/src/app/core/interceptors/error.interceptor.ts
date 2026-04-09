/**
 * @file error.interceptor.ts
 * @description Interceptor HTTP global para el control de flujo y la gestión centralizada de errores.
 * Implementa la lógica de renovación automática de credenciales (Refresh Token Rotation)
 * y la mitigación de brechas de seguridad mediante la revocación inmediata de sesiones inválidas.
 */
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      /* 1. Gestión de denegación de acceso (HTTP 403 Forbidden).
         Aplicable a cuentas suspendidas o intentos de escalada de privilegios.
         Resulta en la finalización inmediata de la sesión. */
      if (error.status === 403) {
        localStorage.removeItem('accessToken');
        router.navigate(['/auth/login']);
        return throwError(() => error);
      }

      /* 2. Gestión de caducidad de credenciales (HTTP 401 Unauthorized).
         Inicia el protocolo de renovación del token de acceso de forma transparente
         para el usuario, previniendo bucles infinitos en rutas de autenticación. */
      if (
        error.status === 401 &&
        !req.url.includes('/auth/login') &&
        !req.url.includes('/auth/refresh')
      ) {
        return authService.refreshToken().pipe(
          switchMap((response) => {
            /* Almacenamiento de la nueva credencial de acceso */
            localStorage.setItem('accessToken', response.data.accessToken);

            /* Reconstrucción de la petición original fallida con el token actualizado */
            const clonedReq = req.clone({
              setHeaders: { Authorization: `Bearer ${response.data.accessToken}` },
            });

            return next(clonedReq);
          }),
          catchError((refreshError) => {
            /* Fallo en la renovación (ej. Refresh Token expirado o revocado en el servidor).
               Se procede al cierre de sesión de seguridad. */
            localStorage.removeItem('accessToken');
            router.navigate(['/auth/login']);
            return throwError(() => refreshError);
          }),
        );
      }

      /* 3. Propagación de errores no contemplados en la lógica de autenticación (400, 404, 500) */
      console.error(
        'Excepción capturada por el interceptor HTTP:',
        error.error?.message || error.message,
      );
      return throwError(() => error);
    }),
  );
};
