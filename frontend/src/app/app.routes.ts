import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // 1. Landing Page (Ruta base pública)
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

  {
    path: 'auth/reset-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password').then((m) => m.ResetPassword),
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
        path: 'proyectos/:id',
        loadComponent: () =>
          import('./features/home/project-workshop/project-workshop').then((m) => m.ProjectWorkshop),
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

  // Rutas de Administrador
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin-layout').then((m) => m.AdminLayout),
    canActivate: [adminGuard], // <-- ¡Protegido!
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
  // 4. Ruta comodín (Wildcard) para errores 404
  {
    path: '**',
    redirectTo: '', // Si la URL no existe, lo mandamos a la Landing Page
    pathMatch: 'full',
  },
];
