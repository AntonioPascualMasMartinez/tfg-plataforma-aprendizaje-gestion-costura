import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service'; // Ajusta la ruta a tu auth.service

import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [Sidebar, RouterOutlet],
  templateUrl: './home.html',
})
export class Home {
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = false;

  onLogout() {
    this.isLoading = true;

    // Llamamos al método logout de tu servicio
    this.authService.logout().subscribe({
      next: () => {
        // Redirigir al login al tener éxito
        localStorage.removeItem('accessToken'); // Limpia el token del almacenamiento local
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        console.error('Error al cerrar sesión', err);
        this.isLoading = false;

        // Es buena práctica redirigir al login incluso si falla,
        // para forzar al usuario a volver a autenticarse.
        this.router.navigate(['/auth/login']);
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }
}
