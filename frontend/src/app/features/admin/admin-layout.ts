/**
 * @file admin-layout.ts
 * @description Componente estructural (Layout) para el módulo de administración.
 * Actúa como contenedor principal (Wrapper) para las vistas protegidas por el `adminGuard`.
 * Gestiona la barra de navegación lateral exclusiva para administradores y el estado global
 * de la sesión en el contexto del panel de control.
 */
import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-layout.html',
})
export class AdminLayout implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);

  /** * Referencia al detector de cambios de Angular.
   * Utilizado para forzar ciclos de renderizado tras la resolución de operaciones asíncronas.
   */
  private cdr = inject(ChangeDetectorRef);

  adminName = 'Cargando...';
  adminInitial = '';

  /** * Configuración estática del árbol de navegación administrativo.
   * Emplea iconos vectoriales (SVG) integrados para optimizar las peticiones de red.
   */
  navItems = [
    {
      label: 'Dashboard',
      path: '/admin/dashboard',
      icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
    },
    {
      label: 'Usuarios',
      path: '/admin/users',
      icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    },
    {
      label: 'Tutoriales',
      path: '/admin/tutorials',
      icon: 'M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z',
    },
    {
      label: 'Moderación',
      path: '/admin/moderation',
      icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z',
    },
  ];

  /**
   * Inicialización del ciclo de vida del componente.
   * Realiza una llamada a la API para recuperar la identidad del administrador
   * autenticado y compone los metadatos visuales del perfil (nombre e inicial).
   */
  ngOnInit(): void {
    this.userService.getMe().subscribe({
      next: (res) => {
        if (res.data) {
          this.adminName = res.data.displayName;
          this.adminInitial = this.adminName.charAt(0).toUpperCase();

          /* Notificación explícita al motor de Angular para conciliar el Virtual DOM 
             con la vista tras la mutación del estado. */
          this.cdr.detectChanges();
        }
      },
    });
  }

  /**
   * Delega la revocación de credenciales al servicio de identidad y
   * efectúa la redirección programática a la pasarela pública.
   */
  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}
