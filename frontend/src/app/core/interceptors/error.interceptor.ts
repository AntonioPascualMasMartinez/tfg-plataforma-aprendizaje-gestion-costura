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
      // 1. Manejo del token expirado (401)
      // Evitamos interceptar si el error viene de intentar hacer login o refresh
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

            // Reintentamos la petición
            return next(clonedReq);
          }),
          catchError((refreshError) => {
            // Si el refresh también falla (ej. la cookie expiró a los 7 días), cerramos sesión
            localStorage.removeItem('accessToken');
            router.navigate(['/auth/login']);
            return throwError(() => refreshError);
          }),
        );
      }

      // 2. Manejo de otros errores (400, 403, 404, 500)
      // Extraemos el mensaje formateado de tu ApiError del backend
      const errorMessage = error.error?.message || 'Ha ocurrido un error inesperado de conexión.';

      // NOTA: Aquí más adelante conectaremos un servicio de Notificaciones (Toasts/Snackbars)
      console.error('Error capturado por el Interceptor:', errorMessage);

      return throwError(() => error);
    }),
  );
};
