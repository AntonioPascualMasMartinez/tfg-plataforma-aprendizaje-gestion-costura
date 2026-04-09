/**
 * @file scroll-animate.directive.ts
 * @description Directiva estructural de Angular para la animación de elementos basada en el desplazamiento (scroll).
 * Implementa la API nativa IntersectionObserver para detectar la entrada de elementos en el viewport,
 * disparando transiciones CSS de forma optimizada. El diseño garantiza la compatibilidad total con
 * Server-Side Rendering (SSR) aislando la lógica exclusiva del navegador.
 */

import { isPlatformBrowser } from '@angular/common';
import {
  Directive,
  ElementRef,
  Renderer2,
  AfterViewInit,
  OnDestroy,
  PLATFORM_ID,
  Inject,
} from '@angular/core';

@Directive({
  selector: '[appScrollAnimate]',
  standalone: true,
})
export class ScrollAnimateDirective implements AfterViewInit, OnDestroy {
  /**
   * Instancia del observador encargado de monitorizar la intersección del elemento con el viewport.
   */
  private observer!: IntersectionObserver;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  /**
   * Método del ciclo de vida ejecutado tras la inicialización de la vista del componente.
   * Configura el estado inicial opaco y registra el observador si el entorno de ejecución lo permite.
   */
  ngAfterViewInit(): void {
    /* Inicialización del estado visual (oculto). El uso de Renderer2 garantiza la 
       compatibilidad con el Server-Side Rendering (SSR), manipulando el DOM de forma 
       segura y previniendo destellos de contenido sin estilo (FOUC) durante la carga inicial. */
    this.renderer.addClass(this.el.nativeElement, 'opacity-0');
    this.renderer.addClass(this.el.nativeElement, 'translate-y-8');
    this.renderer.addClass(this.el.nativeElement, 'transition-all');
    this.renderer.addClass(this.el.nativeElement, 'duration-700');
    this.renderer.addClass(this.el.nativeElement, 'ease-out');

    /* Instanciación condicional del observador exclusiva para el entorno del cliente (navegador web) */
    if (isPlatformBrowser(this.platformId)) {
      const options: IntersectionObserverInit = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 /* El evento se dispara al visualizar el 15% del área del elemento */,
      };

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            /* Transición al estado visible mediante la mutación de clases CSS */
            this.renderer.removeClass(this.el.nativeElement, 'opacity-0');
            this.renderer.removeClass(this.el.nativeElement, 'translate-y-8');
            this.renderer.addClass(this.el.nativeElement, 'opacity-100');
            this.renderer.addClass(this.el.nativeElement, 'translate-y-0');

            /* Finalización de la observación del nodo para reducir la carga de procesamiento computacional */
            this.observer.unobserve(this.el.nativeElement);
          }
        });
      }, options);

      this.observer.observe(this.el.nativeElement);
    }
  }

  /**
   * Método del ciclo de vida ejecutado previa destrucción de la directiva.
   * Responsable de la recolección de basura y limpieza de suscripciones.
   */
  ngOnDestroy(): void {
    /* Liberación de recursos y desconexión total del observador para 
       prevenir fugas de memoria (memory leaks) en la Single Page Application (SPA). */
    if (isPlatformBrowser(this.platformId) && this.observer) {
      this.observer.disconnect();
    }
  }
}
