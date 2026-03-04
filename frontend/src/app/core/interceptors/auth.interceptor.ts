import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. Recuperamos el Access Token de donde lo hayamos guardado al hacer login
  // (Por simplicidad, asumimos que lo guardaremos en el localStorage)
  const accessToken = localStorage.getItem('accessToken');

  // 2. Definimos a qué rutas NO queremos inyectar el token (ej. llamadas a APIs externas de fotos, o login/register)
  const isApiUrl = req.url.startsWith('http://localhost:3000') || req.url.includes('api/v1');

  // 3. Si hay token y la petición es para nuestra API, clonamos la petición y añadimos la cabecera
  if (accessToken && isApiUrl) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Pasamos la petición clonada (con el token) al siguiente eslabón
    return next(clonedRequest);
  }

  // Si no hay token, la petición sigue su curso normal
  return next(req);
};
