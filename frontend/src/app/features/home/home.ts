/**
 * @file home.ts
 * @description Componente estructural (Layout) de la interfaz de usuario autenticada.
 * Actúa como contenedor de alto nivel integrando el sistema de navegación lateral (Sidebar)
 * y el punto de anclaje (RouterOutlet) para las rutas hijas.
 * Gestiona de manera centralizada la invalidación de sesión.
 */
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [Sidebar, RouterOutlet],
  templateUrl: './home.html',
})
export class Home {
  /* Inyección de dependencias para el control de identidad y estado de enrutamiento */
  private authService = inject(AuthService);
  private router = inject(Router);

  /** Indicador de estado para transacciones en curso (e.g., cierre de sesión) */
  isLoading = false;

  /**
   * Orquesta la finalización de la sesión del usuario.
   * Comunica la terminación al servidor, invalida el token de acceso en el almacenamiento local
   * y redirige la vista al punto de entrada público, operando con seguridad frente a fallos de red.
   */
  onLogout(): void {
    this.isLoading = true;

    this.authService.logout().subscribe({
      next: () => {
        localStorage.removeItem('accessToken');
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        console.error('Excepción transaccional durante el cierre de sesión:', err);
        this.isLoading = false;

        /* Estrategia de degradación segura: forzar la expulsión local ante errores del servidor */
        this.router.navigate(['/auth/login']);
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }
}
