/**
 * @file community-card.component.ts
 * @description Componente presentacional (Dumb Component) encargado de renderizar la previsualización
 * de un proyecto en el muro de la comunidad. Carece de lógica de negocio directa, delegando la
 * persistencia y mutación de datos al componente contenedor (Smart Component) mediante eventos de salida.
 */
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project } from '../../models/project.model';
import { User } from '../../models/user.model';

/**
 * Interfaz extendida para gestionar el estado efímero de la interfaz de usuario.
 * Desacopla la vista de la entidad de dominio estricta, permitiendo actualizaciones optimistas.
 */
export interface CommunityProject extends Project {
  likesCount?: number;
  isLikedLocally?: boolean;
}

@Component({
  selector: 'app-community-card',
  standalone: true,
  templateUrl: './community-card.component.html',
})
export class CommunityCardComponent {
  /** Entidad de proyecto inyectada por el componente padre. */
  @Input({ required: true }) project!: CommunityProject;

  /* ==========================================================================
     EMISORES DE EVENTOS (Delegación de lógica al contenedor)
     ========================================================================== */
  @Output() viewDetails = new EventEmitter<CommunityProject>();
  @Output() like = new EventEmitter<{ project: CommunityProject; event: Event }>();
  @Output() report = new EventEmitter<{ project: CommunityProject; event: Event }>();

  /**
   * Captura la interacción de lectura detallada.
   */
  onCardClick(): void {
    this.viewDetails.emit(this.project);
  }

  /**
   * Captura la interacción de valoración positiva.
   * Utiliza stopPropagation para prevenir la activación simultánea de la tarjeta.
   * @param {Event} event - Evento nativo del DOM.
   */
  onLikeClick(event: Event): void {
    event.stopPropagation();
    this.like.emit({ project: this.project, event });
  }

  /**
   * Captura la intención de reporte de moderación.
   * @param {Event} event - Evento nativo del DOM.
   */
  onReportClick(event: Event): void {
    event.stopPropagation();
    this.report.emit({ project: this.project, event });
  }

  /* ==========================================================================
     MÉTODOS DE RESOLUCIÓN DE INTERFAZ
     ========================================================================== */

  /**
   * Evalúa y extrae el nombre de visualización del autor.
   * Contempla escenarios donde la referencia a la entidad User haya sido resuelta (Populate).
   * @param {string | Partial<User>} ownerId - Referencia cruzada del propietario.
   * @returns {string} Nombre resuelto o identificador anónimo por defecto.
   */
  getAuthorName(ownerId: string | Partial<User>): string {
    if (typeof ownerId === 'object' && ownerId !== null && 'displayName' in ownerId) {
      return ownerId.displayName || 'Costurero Anónimo';
    }
    return 'Costurero Anónimo';
  }

  /**
   * Resuelve el activo multimedia del avatar del usuario.
   * Si carece de imagen propia, delega a un servicio externo la generación de un monograma SVG vectorial.
   * @param {string | Partial<User>} ownerId - Referencia cruzada del propietario.
   * @returns {string} URL absoluta del recurso gráfico.
   */
  getAuthorAvatar(ownerId: string | Partial<User>): string {
    if (typeof ownerId === 'object' && ownerId !== null && 'avatar' in ownerId && ownerId.avatar) {
      return ownerId.avatar;
    }

    const name = this.getAuthorName(ownerId);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ffedd5&color=ea580c&rounded=true&bold=true`;
  }
}
