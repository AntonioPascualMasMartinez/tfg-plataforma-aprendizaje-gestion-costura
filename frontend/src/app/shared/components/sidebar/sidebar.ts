/**
 * @file sidebar.ts
 * @description Componente estructural de navegación lateral (Layout Privado).
 * Implementa la integración con los servicios de autenticación y usuario, evaluando de
 * forma dinámica los privilegios (RBAC) para el renderizado condicional de opciones administrativas.
 * Gestiona el ciclo de vida de la sesión (Logout) y el estado global del esquema de color (Theme).
 */
import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NgClass, isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { ConfirmModalComponent } from '../../modals/confirm-modal/confirm-modal.component';
import { ChangeDetectorRef } from '@angular/core';

/**
 * Contrato de tipado para los nodos de navegación del menú lateral.
 */
interface NavItem {
  label: string;
  path: string;
  icon: string;
  safeIcon?: SafeHtml;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, ConfirmModalComponent, NgClass],
  templateUrl: './sidebar.html',
  styles: [
    `
      .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: rgba(0, 0, 0, 0.1);
        border-radius: 20px;
      }
      :host-context(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: rgba(255, 255, 255, 0.1);
      }
    `,
  ],
})
export class Sidebar implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  isLoadingLogout = false;
  showLogoutModal = false;
  isDarkMode = false;

  /** Bandera de autorización (RBAC) para revelar funciones exclusivas de administrador. */
  isAdmin = false;

  /** Colección estática de enlaces con sus respectivos elementos vectoriales (SVG). */
  navItems: NavItem[] = [
    {
      label: 'Inicio',
      path: '/home/inicio',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />',
    },
    {
      label: 'Proyectos',
      path: '/home/proyectos',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />',
    },
    {
      label: 'Tutoriales',
      path: '/home/tutoriales',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />',
    },
    {
      label: 'Comunidad',
      path: '/home/comunidad',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />',
    },
    {
      label: 'Perfil',
      path: '/home/perfil',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />',
    },
  ];

  ngOnInit(): void {
    /* Sanitización del código SVG en crudo para prevenir ataques de Cross-Site Scripting (XSS) */
    this.navItems = this.navItems.map((item) => ({
      ...item,
      safeIcon: this.sanitizer.bypassSecurityTrustHtml(item.icon),
    }));

    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

      if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        this.isDarkMode = true;
        document.documentElement.classList.add('dark');
      }
    }

    this.checkUserRole();
  }

  /**
   * Consulta al servicio de telemetría personal para obtener los atributos
   * del usuario en sesión y establecer los niveles de autorización en la vista.
   */
  private checkUserRole(): void {
    this.userService.getMe().subscribe({
      next: (res) => {
        if (res.data && res.data.role === 'Admin') {
          this.isAdmin = true;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Anomalía durante la verificación del nivel de autorización:', err);
      },
    });
  }

  toggleTheme(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isDarkMode = !this.isDarkMode;
      if (this.isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }
  }

  /**
   * Ejecuta el protocolo de cierre de sesión, revocando el token de acceso local
   * y delegando la invalidación de cookies al servidor de autenticación.
   */
  confirmLogout(): void {
    this.isLoadingLogout = true;
    this.authService.logout().subscribe({
      next: () => {
        localStorage.removeItem('accessToken');
        this.showLogoutModal = false;
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        console.error('Fallo en la resolución del cierre de sesión HTTP:', err);
        this.showLogoutModal = false;
        this.router.navigate(['/auth/login']);
      },
      complete: () => {
        this.isLoadingLogout = false;
      },
    });
  }

  requestLogout(): void {
    this.showLogoutModal = true;
  }

  cancelLogout(): void {
    this.showLogoutModal = false;
  }
}
