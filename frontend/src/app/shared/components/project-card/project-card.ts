import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project } from '../../models/project.model';
import { DatePipe, NgClass, NgIf } from '@angular/common';
import { ConfirmModalComponent } from '../../modals/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [RouterLink, NgClass, NgIf, ConfirmModalComponent, DatePipe],
  templateUrl: './project-card.html',
})
export class ProjectCardComponent {
  @Input({ required: true }) project!: Project;
  @Output() delete = new EventEmitter<string>();

  showDeleteModal = false;

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

  // RENAMED GETTER Y CLASES ACTUALIZADAS
  // Ahora solo definimos colores de texto y borde. El fondo lo definimos estático en el HTML.
  get difficultyTextColorClass(): string {
    switch (this.project.difficulty) {
      case 'Fácil': // Verde
        return 'text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800/50';
      case 'Intermedio': // Amarillo
        return 'text-amber-800 border-amber-200 dark:text-amber-400 dark:border-amber-800/50';
      case 'Avanzado': // Rosa/Rojo
        return 'text-rose-700 border-rose-200 dark:text-rose-400 dark:border-rose-800/50';
      default: // Gris por defecto
        return 'text-gray-700 border-gray-200 dark:text-gray-300 dark:border-gray-700';
    }
  }

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

  onDeleteRequest(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.showDeleteModal = true;
  }

  confirmDelete() {
    this.delete.emit(this.project._id);
    this.showDeleteModal = false;
  }

  cancelDelete() {
    this.showDeleteModal = false;
  }
}
