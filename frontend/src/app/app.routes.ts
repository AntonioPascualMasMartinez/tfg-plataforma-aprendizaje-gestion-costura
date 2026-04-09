/**
 * @file app.routes.ts
 * @description Definición del árbol de enrutamiento principal de la plataforma.
 * Implementa un modelo de carga diferida (Lazy Loading) a nivel de componente para optimizar
 * el peso del paquete inicial (bundle size) y reducir el tiempo de carga (TTI).
 * Las rutas están estrictamente segregadas mediante guardianes de navegación que evalúan
 * el estado de la sesión y los privilegios de Control de Acceso Basado en Roles (RBAC).
 */
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  /* ==========================================================================
     1. RUTAS PÚBLICAS Y LEGALES (Protegidas por GuestGuard)
     ========================================================================== */
  {
    path: '',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/landing/landing').then((m) => m.Landing),
  },
  {
    path: 'legal-notice',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/legal/legal-notice/legal-notice').then((m) => m.LegalNotice),
  },
  {
    path: 'privacy-policy',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/legal/privacy-policy/privacy-policy').then((m) => m.PrivacyPolicy),
  },
  {
    path: 'terms-of-use',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/legal/terms-of-use/terms-of-use').then((m) => m.TermsOfUse),
  },

  /* ==========================================================================
     2. MÓDULO DE IDENTIDAD Y AUTENTICACIÓN (Protegidas por GuestGuard)
     ========================================================================== */
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
  {
    path: 'auth/reset-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password').then((m) => m.ResetPassword),
  },

  /* ==========================================================================
     3. ENTORNO PRIVADO / HUB DEL USUARIO (Protegido por AuthGuard)
     ========================================================================== */
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
    children: [
      /* Redirección por defecto del panel de control */
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },

      /* Módulos de la aplicación de usuario */
      {
        path: 'inicio',
        loadComponent: () => import('./features/home/inicio/inicio').then((m) => m.Inicio),
      },
      {
        path: 'proyectos',
        loadComponent: () => import('./features/home/proyectos/proyectos').then((m) => m.Proyectos),
      },
      {
        path: 'proyectos/:id',
        loadComponent: () =>
          import('./features/home/project-workshop/project-workshop').then(
            (m) => m.ProjectWorkshop,
          ),
      },
      {
        path: 'proyectos/:id/edit',
        loadComponent: () =>
          import('./features/home/project-detail/project-detail').then((m) => m.ProjectDetail),
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

  /* ==========================================================================
     4. PANEL DE ADMINISTRACIÓN Y TELEMETRÍA (Protegido por AdminGuard)
     ========================================================================== */
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin-layout').then((m) => m.AdminLayout),
    canActivate: [adminGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'tutorials',
        loadComponent: () =>
          import('./features/admin/tutorials/tutorials.component').then(
            (m) => m.TutorialsComponent,
          ),
      },
      {
        path: 'moderation',
        loadComponent: () =>
          import('./features/admin/moderation/moderation.component').then(
            (m) => m.ModerationComponent,
          ),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  /* ==========================================================================
     5. RUTAS COMODÍN (Manejo de Errores 404)
     ========================================================================== */
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
