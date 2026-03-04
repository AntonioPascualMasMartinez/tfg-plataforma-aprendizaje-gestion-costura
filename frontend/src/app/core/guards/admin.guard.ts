import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('accessToken');

  if (token) {
    try {
      // Decodificamos el JWT para extraer el payload (donde metimos el rol en el backend)
      const decodedToken: any = jwtDecode(token);

      if (decodedToken.role === 'Admin') {
        return true; // Es administrador, pasa.
      }
    } catch (error) {
      console.error('Error decodificando el token:', error);
    }
  }

  // Si no es admin, o el token es inválido, lo redirigimos a un sitio seguro (su perfil o inicio)
  router.navigate(['/profile']);
  return false;
};
