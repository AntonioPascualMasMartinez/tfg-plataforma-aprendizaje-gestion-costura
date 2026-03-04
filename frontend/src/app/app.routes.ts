import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  // 1. Landing Page (Ruta base pública)
  {
    path: '',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/landing/landing').then((m) => m.Landing),
  },

  // 2. Rutas de Autenticación
  {
    path: 'auth/login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'auth/register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },

  {
    path: 'auth/forgot-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password').then((m) => m.ForgotPassword),
  },

  // 3. Hub Principal (Ruta Privada - Protegida por el Guard)
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./features/home/home').then((m) => m.Home), // Este será nuestro Layout
    children: [
      // Redirección por defecto al entrar a /home
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },

      // Las 5 secciones principales
      {
        path: 'inicio',
        loadComponent: () => import('./features/home/inicio/inicio').then((m) => m.Inicio),
      },
      {
        path: 'proyectos',
        loadComponent: () => import('./features/home/proyectos/proyectos').then((m) => m.Proyectos),
      },
      {
        path: 'tutoriales',
        loadComponent: () =>
          import('./features/home/tutoriales/tutoriales').then((m) => m.Tutoriales),
      },
      {
        path: 'comunidad',
        loadComponent: () => import('./features/home/comunidad/comunidad').then((m) => m.Comunidad),
      },
      {
        path: 'perfil',
        loadComponent: () => import('./features/home/perfil/perfil').then((m) => m.Perfil),
      },
    ],
  },

  // 4. Ruta comodín (Wildcard) para errores 404
  {
    path: '**',
    redirectTo: '', // Si la URL no existe, lo mandamos a la Landing Page
    pathMatch: 'full',
  },
];
