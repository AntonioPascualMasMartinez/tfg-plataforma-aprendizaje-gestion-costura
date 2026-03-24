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
      // 1. Manejo de usuario BANEADO o SIN PERMISOS (403)
      // Rompe el bucle: expulsa al usuario inmediatamente y NO intenta refrescar.
      if (error.status === 403) {
        localStorage.removeItem('accessToken');
        router.navigate(['/auth/login']);
        return throwError(() => error);
      }

      // 2. Manejo del token EXPIRADO (401)
      if (
        error.status === 401 &&
        !req.url.includes('/auth/login') &&
        !req.url.includes('/auth/refresh')
      ) {
        return authService.refreshToken().pipe(
          switchMap((response) => {
            // Guardamos el nuevo Access Token
            localStorage.setItem('accessToken', response.data.accessToken);

            // Clonamos la petición original que falló y le inyectamos el nuevo token
            const clonedReq = req.clone({
              setHeaders: { Authorization: `Bearer ${response.data.accessToken}` },
            });

            // Reintentamos la petición original
            return next(clonedReq);
          }),
          catchError((refreshError) => {
            // Si el refresh falla (ej. la cookie expiró), cerramos sesión
            localStorage.removeItem('accessToken');
            router.navigate(['/auth/login']);
            return throwError(() => refreshError);
          }),
        );
      }

      // 3. Manejo de otros errores (400, 404, 500)
      console.error('Error capturado por el Interceptor:', error.error?.message || error.message);
      return throwError(() => error);
    }),
  );
};
