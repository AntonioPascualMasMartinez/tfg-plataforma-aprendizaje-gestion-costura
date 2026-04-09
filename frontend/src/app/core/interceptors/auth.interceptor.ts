/**
 * @file auth.interceptor.ts
 * @description Interceptor HTTP encargado de la inyección automática de credenciales de acceso.
 * Adjunta el JSON Web Token (JWT) en la cabecera 'Authorization' de todas las peticiones
 * salientes dirigidas a la API del sistema, validando previamente el entorno de ejecución
 * para prevenir errores de acceso al almacenamiento local en contextos de Server-Side Rendering (SSR).
 */
import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  /* Extracción del token de acceso condicionada al entorno del navegador web */
  const accessToken = isPlatformBrowser(platformId) ? localStorage.getItem('accessToken') : null;

  /* Validación del destino de la petición para evitar la exposición del token a dominios de terceros */
  const isApiUrl = req.url.startsWith('http://localhost:3000') || req.url.includes('api/v1');

  if (accessToken && isApiUrl) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  return next(req);
};
