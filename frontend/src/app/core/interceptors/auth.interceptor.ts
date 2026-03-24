import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const accessToken = localStorage.getItem('accessToken');
  const isApiUrl = req.url.startsWith('http://localhost:3000') || req.url.includes('api/v1');

  if (accessToken && isApiUrl) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  // Pasamos la petición directamente. Si falla, el error.interceptor se encargará.
  return next(req);
};
