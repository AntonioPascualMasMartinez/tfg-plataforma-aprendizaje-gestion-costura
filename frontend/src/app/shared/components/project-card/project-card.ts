import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project } from '../../models/project.model';
import { DatePipe, NgClass } from '@angular/common';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [RouterLink, NgClass],
  templateUrl: './project-card.html',
})
export class ProjectCardComponent {
  @Input({ required: true }) project!: Project;
  @Output() delete = new EventEmitter<string>();

  get coverImage(): string | null {
    // 1. Prioridad: La nueva imagen de inspiración
    if (this.project.inspirationImageUrl) {
      return this.project.inspirationImageUrl;
    }

    // 2. Fallback: La primera imagen que encuentre en los pasos
    if (this.project.steps && this.project.steps.length > 0) {
      const stepWithImage = this.project.steps.find((step) => step.mediaUrl);
      return stepWithImage ? stepWithImage.mediaUrl : null;
    }

    return null;
  }

  // Helper para asignar colores según la dificultad
  get difficultyColorClass(): string {
    switch (this.project.difficulty) {
      case 'Fácil':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'Intermedio':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'Avanzado':
        return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
      default:
        return 'bg-surface-hover text-muted border-border-main/20';
    }
  }

  onDelete(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.delete.emit(this.project._id);
  }
}
