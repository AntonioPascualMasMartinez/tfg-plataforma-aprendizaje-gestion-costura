import { Component, HostListener, OnInit, inject, PLATFORM_ID, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, NgClass],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar implements OnInit {
  // Uso de Signals para una reactividad moderna en Angular 21
  isScrolled = signal(false);
  isMobileMenuOpen = signal(false);
  isDarkMode = signal(false);

  private platformId = inject(PLATFORM_ID);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

      if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        this.isDarkMode.set(true);
        document.documentElement.classList.add('dark');
      }
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (isPlatformBrowser(this.platformId)) {
      this.isScrolled.set(window.scrollY > 20);
    }
  }

  // Accesibilidad: Cerrar el menú móvil con Escape
  @HostListener('document:keydown.escape')
  onKeydownHandler() {
    if (this.isMobileMenuOpen()) {
      this.closeMobileMenu();
    }
  }

  toggleMobileMenu(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.isMobileMenuOpen.update((v) => !v);
    this.handleBodyScroll();
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
    this.handleBodyScroll();
  }

  // UX: Bloquear el scroll del fondo cuando el menú móvil está abierto
  private handleBodyScroll() {
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = this.isMobileMenuOpen() ? 'hidden' : '';
    }
  }

  toggleTheme() {
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
