/**
 * @file hero.ts
 * @description Componente correspondiente a la cabecera principal (Hero Section) de la Landing Page.
 * Incorpora un carrusel de imágenes temporizado y elementos visuales flotantes.
 * La gestión del temporizador se monitoriza estrictamente en los ciclos de vida del componente
 * para evitar fugas de memoria (Memory Leaks) en la navegación por la Single Page Application (SPA).
 */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { ScrollAnimateDirective } from '../../../shared/directives/scroll-animate.directive';

/** Contrato estructural para la instanciación de partículas animadas en el fondo. */
interface SewingElement {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  size: string;
  color: string;
  rotation: string;
  animation: string;
  delay: string;
  type: 'scissor' | 'needle' | 'spool' | 'pin';
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink, NgClass, ScrollAnimateDirective],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero implements OnInit, OnDestroy {
  heroImages: string[] = ['/hero/hero-1.webp', '/hero/hero-2.webp', '/hero/hero-3.webp'];
  currentImageIndex: number = 0;

  /** Referencia transaccional al intervalo de ejecución para el carrusel automatizado. */
  private imageInterval: ReturnType<typeof setInterval> | null = null;

  floatingElements: SewingElement[] = [
    {
      top: '5%',
      left: '8%',
      size: 'w-24 h-24',
      color: 'text-rose-300/30',
      rotation: '-rotate-12',
      animation: 'float-element-slow',
      delay: '0s',
      type: 'scissor',
    },
    {
      top: '15%',
      right: '45%',
      size: 'w-16 h-16',
      color: 'text-pink-400/20',
      rotation: 'rotate-45',
      animation: 'float-element',
      delay: '1.5s',
      type: 'needle',
    },
    {
      top: '25%',
      right: '8%',
      size: 'w-20 h-20',
      color: 'text-primary/20',
      rotation: 'rotate-12',
      animation: 'float-element-slow',
      delay: '0.5s',
      type: 'spool',
    },
    {
      bottom: '35%',
      left: '45%',
      size: 'w-12 h-12',
      color: 'text-rose-400/25',
      rotation: '-rotate-45',
      animation: 'float-element',
      delay: '2s',
      type: 'pin',
    },
    {
      bottom: '15%',
      left: '12%',
      size: 'w-28 h-28',
      color: 'text-pink-300/20',
      rotation: 'rotate-180',
      animation: 'float-element-slow',
      delay: '1s',
      type: 'scissor',
    },
    {
      bottom: '20%',
      right: '15%',
      size: 'w-16 h-16',
      color: 'text-rose-300/30',
      rotation: 'rotate-90',
      animation: 'float-element',
      delay: '3s',
      type: 'spool',
    },
  ];

  /**
   * Inicialización del componente.
   * Dispara la rutina de transición temporal para la presentación dinámica de imágenes.
   */
  ngOnInit(): void {
    this.startImageTransition();
  }

  /**
   * Recolección de basura. Destrucción explícita del intervalo de redibujado
   * para asegurar la integridad de rendimiento tras el desmontaje del DOM.
   */
  ngOnDestroy(): void {
    this.stopImageTransition();
  }

  /**
   * Inicia o reinicia el bucle algorítmico del carrusel con una cadencia de 5000 ms.
   */
  startImageTransition(): void {
    this.stopImageTransition();
    this.imageInterval = setInterval(() => {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.heroImages.length;
    }, 5000);
  }

  /**
   * Interrumpe de manera segura la transición automatizada de imágenes.
   */
  private stopImageTransition(): void {
    if (this.imageInterval) {
      clearInterval(this.imageInterval);
      this.imageInterval = null;
    }
  }

  /**
   * Intercepta la navegación manual del usuario sobre los controles de paginación
   * e interrumpe temporalmente el temporizador para evitar saltos prematuros.
   * @param {number} index - Posición vectorial de la imagen objetivo.
   */
  setCurrentImage(index: number): void {
    this.currentImageIndex = index;
    this.startImageTransition();
  }
}
