import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project } from '../../models/project.model';
import { DatePipe, NgClass } from '@angular/common'; // Asegúrate de tener DatePipe aquí
import { ConfirmModalComponent } from '../../modals/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-project-card',
  standalone: true,
  // ¡IMPORTANTE! Añade DatePipe a los imports
  imports: [RouterLink, NgClass, ConfirmModalComponent, DatePipe],
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

  // Colores mejorados para dificultad con fondo suave y borde
  get difficultyColorClass(): string {
    switch (this.project.difficulty) {
      case 'Fácil':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50';
      case 'Intermedio':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50';
      case 'Avanzado':
        return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  }

  // NUEVO: Configuración visual para el Estado del proyecto
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
