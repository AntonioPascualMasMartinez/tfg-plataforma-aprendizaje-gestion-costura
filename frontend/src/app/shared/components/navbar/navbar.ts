/**
 * @file navbar.ts
 * @description Componente estructural de cabecera y navegación superior.
 * Implementa la gestión integral de temas (claro/oscuro), navegación adaptativa (Mobile/Desktop),
 * y un sistema de telemetría visual (Scroll Spy) empleando el API IntersectionObserver.
 */
import {
  Component,
  HostListener,
  OnInit,
  AfterViewInit,
  OnDestroy,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, NgClass],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar implements OnInit, AfterViewInit, OnDestroy {
  /* Almacenes de estado reactivo mediante Angular Signals */
  isScrolled = signal(false);
  isMobileMenuOpen = signal(false);
  isDarkMode = signal(false);
  activeSection = signal<string>('');

  private platformId = inject(PLATFORM_ID);
  private observer: IntersectionObserver | null = null;

  /**
   * Ciclo de vida: Inicialización.
   * Resuelve el esquema de color preferido consultando el almacenamiento local
   * o las directivas del sistema operativo (prefers-color-scheme), condicionado al entorno del navegador.
   */
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

      if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        this.isDarkMode.set(true);
        document.documentElement.classList.add('dark');
      }
    }
  }

  /**
   * Ciclo de vida: Post-renderizado de vista.
   * Configura la observación de intersección tras la instanciación completa del DOM.
   */
  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.setupScrollSpy();
    }
  }

  /**
   * Prevención de fugas de memoria (Memory Leaks) al destruir el componente.
   */
  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  /**
   * Inicializa el observador de intersección para rastrear qué bloque semántico
   * del documento (Landing Page) se encuentra actualmente en el viewport del usuario.
   */
  private setupScrollSpy(): void {
    const sections = ['encontrar', 'funcionamiento', 'tutoriales', 'comunidad'];

    const options = {
      root: null,
      rootMargin: '-40% 0px -60% 0px', // Tolerancia algorítmica para activación central
      threshold: 0,
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.activeSection.set(entry.target.id);
        }
      });
    }, options);

    setTimeout(() => {
      sections.forEach((section) => {
        const element = document.getElementById(section);
        if (element) {
          this.observer?.observe(element);
        }
      });
    }, 300);
  }

  /**
   * Escucha global del desplazamiento vertical para la compresión visual de la cabecera.
   */
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isScrolled.set(window.scrollY > 20);
    }
  }

  /**
   * Accesibilidad: Cierre del menú móvil mediante la tecla Escape.
   */
  @HostListener('document:keydown.escape')
  onKeydownHandler(): void {
    if (this.isMobileMenuOpen()) {
      this.closeMobileMenu();
    }
  }

  /**
   * Conmuta el estado de apertura de la navegación móvil.
   * @param {Event} [event] - Evento de clic opcional para prevenir propagación.
   */
  toggleMobileMenu(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.isMobileMenuOpen.update((v) => !v);
    this.handleBodyScroll();
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
    this.handleBodyScroll();
  }

  /**
   * Bloquea el desplazamiento del documento subyacente (Body Lock)
   * cuando el panel modal de navegación está activo.
   */
  private handleBodyScroll(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = this.isMobileMenuOpen() ? 'hidden' : '';
    }
  }

  /**
   * Ejecuta la transición de modo de contraste y persiste la preferencia del usuario.
   */
  toggleTheme(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isDarkMode.update((v) => !v);
      if (this.isDarkMode()) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }
  }
}
