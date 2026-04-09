/**
 * @file project-card.ts
 * @description Componente presentacional (Dumb Component) para la visualización resumida de un proyecto.
 * Emplea propiedades computadas (Getters) para resolver estados visuales, métricas de progreso
 * y clases de diseño (Tailwind CSS) basándose en las especificaciones de la entidad de dominio.
 * Delega cualquier mutación de estado al componente contenedor mediante eventos de salida (@Output).
 */
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project } from '../../models/project.model';
import { DatePipe, NgClass, NgIf } from '@angular/common';
import { ConfirmModalComponent } from '../../modals/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [RouterLink, NgClass, ConfirmModalComponent, DatePipe],
  templateUrl: './project-card.html',
})
export class ProjectCardComponent {
  /** Entidad del proyecto a renderizar. */
  @Input({ required: true }) project!: Project;

  /** Determina el contexto de renderizado para adaptar la interfaz visual. */
  @Input() activeView: 'taller' | 'portafolio' = 'taller';

  /** Bandera booleana que indica la completitud estructural del proyecto. */
  @Input() isComplete: boolean = false;

  /* Emisores de eventos para la delegación de operaciones críticas */
  @Output() delete = new EventEmitter<string>();
  @Output() toggleVisibility = new EventEmitter<void>();

  /** Estado local para el control de renderizado del modal de confirmación destructiva. */
  showDeleteModal = false;

  /**
   * Resuelve el activo multimedia principal del proyecto.
   * Prioriza la imagen de inspiración general; de no existir, itera sobre los pasos de construcción.
   * @returns {string | null} URL absoluta de la imagen o valor nulo.
   */
  get coverImage(): string | null {
    if (this.project.inspirationImageUrl) {
      return this.project.inspirationImageUrl;
    }
    if (this.project.steps && this.project.steps.length > 0) {
      const stepWithImage = this.project.steps.find((step) => step.mediaUrl);
      return stepWithImage ? stepWithImage.mediaUrl : null;
    }
    return null;
  }

  get isFromTutorial(): boolean {
    return this.project.projectType === 'Comenzado desde Tutorial';
  }

  get completedSteps(): number {
    if (!this.project.steps) return 0;
    return this.project.steps.filter((step) => step.status === 'Completado').length;
  }

  get acquiredMaterials(): number {
    if (!this.project.materials) return 0;
    return this.project.materials.filter((mat) => mat.isAcquired).length;
  }

  /**
   * Mapea semánticamente la dificultad del proyecto a variables del sistema de diseño.
   */
  get difficultyTextColorClass(): string {
    switch (this.project.difficulty) {
      case 'Fácil':
        return 'text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800/50';
      case 'Intermedio':
        return 'text-amber-800 border-amber-200 dark:text-amber-400 dark:border-amber-800/50';
      case 'Avanzado':
        return 'text-rose-700 border-rose-200 dark:text-rose-400 dark:border-rose-800/50';
      default:
        return 'text-gray-700 border-gray-200 dark:text-gray-300 dark:border-gray-700';
    }
  }

  /**
   * Genera el diccionario de configuración de estilos según la máquina de estados del proyecto.
   */
  get statusConfig() {
    switch (this.project.status) {
      case 'En curso':
        return { dot: 'bg-info', bg: 'bg-surface/90', text: 'text-text-main' };
      case 'Finalizado':
        return { dot: 'bg-success', bg: 'bg-surface/90', text: 'text-text-main' };
      case 'Pausado':
        return { dot: 'bg-warning', bg: 'bg-surface/90', text: 'text-text-main' };
      case 'Planificado':
      default:
        return { dot: 'bg-muted', bg: 'bg-surface/90', text: 'text-muted' };
    }
  }

  /**
   * Intercepta la acción de alteración de visibilidad y previene la propagación del evento de enrutamiento.
   * @param {Event} event - Interacción original del DOM.
   */
  onToggleVisibility(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.toggleVisibility.emit();
  }

  /**
   * Despliega la interfaz de confirmación de borrado previniendo la apertura accidental del proyecto.
   */
  onDeleteRequest(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    this.delete.emit(this.project._id);
    this.showDeleteModal = false;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
  }

  /**
   * Calcula dinámicamente la ruta de destino (Workshop vs. Editor base)
   * según la tipología del proyecto y su estado de publicación.
   */
  get projectRoute(): string[] {
    if (this.isFromTutorial || this.isAdaptedFromCommunity) {
      return ['/home/proyectos', this.project._id];
    }
    return this.project.isPublic
      ? ['/home/proyectos', this.project._id]
      : ['/home/proyectos', this.project._id, 'edit'];
  }

  get isAdaptedFromCommunity(): boolean {
    return this.project.projectType === 'Adaptado de la Comunidad';
  }

  get isOriginal(): boolean {
    return this.project.projectType === 'Nuevo';
  }
}
