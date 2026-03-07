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
  private observer!: IntersectionObserver;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngAfterViewInit() {
    // 1. Configuramos las clases iniciales (estado oculto)
    this.renderer.addClass(this.el.nativeElement, 'opacity-0');
    this.renderer.addClass(this.el.nativeElement, 'translate-y-8');
    this.renderer.addClass(this.el.nativeElement, 'transition-all');
    this.renderer.addClass(this.el.nativeElement, 'duration-700');
    this.renderer.addClass(this.el.nativeElement, 'ease-out');

    // 2. Creamos el Intersection Observer
    const options = {
      root: null, // Usa el viewport del navegador
      rootMargin: '0px',
      threshold: 0.15, // Se activa cuando el 15% del elemento es visible
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // 3. Cuando entra en pantalla, cambiamos las clases (estado visible)
          this.renderer.removeClass(this.el.nativeElement, 'opacity-0');
          this.renderer.removeClass(this.el.nativeElement, 'translate-y-8');
          this.renderer.addClass(this.el.nativeElement, 'opacity-100');
          this.renderer.addClass(this.el.nativeElement, 'translate-y-0');

          // Dejamos de observar el elemento una vez animado para ahorrar recursos
          this.observer.unobserve(this.el.nativeElement);
        }
      });
    }, options);

    // Iniciar la observación del elemento
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy() {
    // Limpieza vital para evitar fugas de memoria (Memory Leaks)
    if (isPlatformBrowser(this.platformId) && this.observer) {
      this.observer.disconnect();
    }
  }
}
