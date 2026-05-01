/**
 * @file landing.ts
 * @description Componente orquestador (Layout/Wrapper) de la página pública de inicio.
 * Ensambla y coordina las distintas secciones presentacionales (Hero, Features, Works, etc.).
 * Implementa un rastreador de progreso de desplazamiento (Scroll Progress) optimizado
 * mediante el estrangulamiento de eventos (Throttling) con `requestAnimationFrame`.
 */
import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ElementRef,
  ChangeDetectorRef,
  inject,
} from '@angular/core';

import { Navbar } from '../../shared/components/navbar/navbar';
import { Footer } from '../../shared/components/footer/footer';

import { Hero } from './hero/hero';
import { Features } from './features/features';
import { Works } from './works/works';
import { Tutorials } from './tutorials/tutorials';
import { Community } from './community/community';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [Navbar, Footer, Hero, Features, Works, Tutorials, Community],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing implements OnInit, OnDestroy {
  /* ==========================================================================
     ESTADO DEL SEGUIMIENTO DE DESPLAZAMIENTO (SCROLL SPY)
     ========================================================================== */

  /** Porcentaje de avance del usuario en el documento actual (0 a 100). */
  scrollProgress: number = 0;

  /** Bandera de control (Mutex) para prevenir el apilamiento de llamadas al motor de renderizado. */
  private ticking = false;
  private cdr = inject(ChangeDetectorRef);

  constructor(private el: ElementRef) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {}

  /**
   * Intercepta el evento global de desplazamiento (scroll).
   * Delega el cálculo de las métricas al API del navegador `requestAnimationFrame`
   * para desacoplarlo del ciclo de detección de cambios sincrónico de Angular,
   * garantizando los 60 FPS durante el redibujado de la interfaz.
   */
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (!this.ticking) {
      requestAnimationFrame(() => {
        const scrollPosition = window.scrollY || document.documentElement.scrollTop || 0;
        const windowHeight =
          document.documentElement.scrollHeight - document.documentElement.clientHeight;

        if (windowHeight > 0) {
          this.scrollProgress = (scrollPosition / windowHeight) * 100;
        } else {
          this.scrollProgress = 0;
        }

        this.ticking = false;
        this.cdr.detectChanges();
      });
      this.ticking = true;
    }
  }
}
