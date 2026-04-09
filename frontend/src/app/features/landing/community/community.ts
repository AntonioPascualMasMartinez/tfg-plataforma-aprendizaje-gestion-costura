/**
 * @file community.ts
 * @description Componente presentacional de la sección "Comunidad" en la página de aterrizaje.
 * Actúa como un escaparate visual (Showcase) utilizando datos estáticos simulados (Mock Data)
 * para ilustrar las capacidades sociales de la plataforma a usuarios no autenticados, sin
 * incurrir en llamadas costosas a la base de datos.
 */
import { Component } from '@angular/core';
import { NgClass } from '@angular/common';
import { ScrollAnimateDirective } from '../../../shared/directives/scroll-animate.directive';
import {
  CommunityCardComponent,
  CommunityProject,
} from '../../../shared/components/community-card/community-card.component';

/**
 * Contrato de tipado para los elementos decorativos renderizados estáticamente en el DOM.
 * Configura la posición absoluta y las clases utilitarias de animación.
 */
interface SewingDecoration {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  size: string;
  color: string;
  rotation: string;
  animation: string;
  delay: string;
  type: 'thimble' | 'button' | 'spool' | 'scissors';
}

@Component({
  selector: 'app-community',
  standalone: true,
  imports: [NgClass, ScrollAnimateDirective, CommunityCardComponent],
  templateUrl: './community.html',
  styleUrl: './community.scss',
})
export class Community {
  /** Colección de entidades de proyecto simuladas para la previsualización del feed. */
  communityPosts: CommunityProject[] = [
    {
      _id: 'landing-post-1',
      title: 'Chaqueta Denim Vintage',
      inspirationImageUrl: '/hero/hero-1.webp',
      category: 'Ropa',
      difficulty: 'Intermedio',
      status: 'Finalizado',
      likesCount: 24,
      isLikedLocally: false,
      ownerId: { displayName: 'Mark G.', avatar: '' } as any,
    } as CommunityProject,
    {
      _id: 'landing-post-2',
      title: 'Bolso de Lino Natural',
      inspirationImageUrl: '/hero/hero-2.webp',
      category: 'Accesorios',
      difficulty: 'Fácil',
      status: 'Finalizado',
      likesCount: 156,
      isLikedLocally: false,
      ownerId: { displayName: 'Laura C.', avatar: '' } as any,
    } as CommunityProject,
    {
      _id: 'landing-post-3',
      title: 'Vestido Floral de Verano',
      inspirationImageUrl: '/hero/hero-3.webp',
      category: 'Ropa',
      difficulty: 'Avanzado',
      status: 'Finalizado',
      likesCount: 89,
      isLikedLocally: false,
      ownerId: { displayName: 'Ana P.', avatar: '' } as any,
    } as CommunityProject,
  ];

  /** Disposición espacial de la utilería gráfica del fondo. */
  backgroundDecorations: SewingDecoration[] = [
    {
      top: '10%',
      left: '8%',
      size: 'w-20 h-20',
      color: 'text-rose-300/20',
      rotation: '-rotate-12',
      animation: 'float-element-slow',
      delay: '0s',
      type: 'scissors',
    },
    {
      top: '30%',
      right: '5%',
      size: 'w-16 h-16',
      color: 'text-primary/15',
      rotation: 'rotate-45',
      animation: 'float-element',
      delay: '1s',
      type: 'spool',
    },
    {
      bottom: '20%',
      left: '10%',
      size: 'w-14 h-14',
      color: 'text-pink-400/20',
      rotation: '-rotate-45',
      animation: 'float-element-slow',
      delay: '2s',
      type: 'thimble',
    },
    {
      bottom: '10%',
      right: '12%',
      size: 'w-24 h-24',
      color: 'text-rose-400/15',
      rotation: 'rotate-12',
      animation: 'float-element',
      delay: '0.5s',
      type: 'button',
    },
  ];

  /**
   * Intercepta la interacción de valoración de la tarjeta y muta el estado local del componente.
   * Evita la propagación del evento para mantener al usuario en la página de aterrizaje.
   * @param {Object} payload - Objeto contenedor con el proyecto interactuado y el evento del DOM.
   */
  handleMockLike(payload: { project: CommunityProject; event: Event }): void {
    payload.event.preventDefault();
    payload.event.stopPropagation();
    const project = payload.project;
    project.isLikedLocally = !project.isLikedLocally;
    project.likesCount = (project.likesCount || 0) + (project.isLikedLocally ? 1 : -1);
  }
}
