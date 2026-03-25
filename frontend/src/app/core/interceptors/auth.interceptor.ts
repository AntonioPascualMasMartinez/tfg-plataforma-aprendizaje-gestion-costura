import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  // Solo leemos el localStorage si estamos en el navegador
  const accessToken = isPlatformBrowser(platformId) ? localStorage.getItem('accessToken') : null;

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
