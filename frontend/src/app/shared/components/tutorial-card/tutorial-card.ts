import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Tutorial } from '../../../shared/models/tutorial.model';

@Component({
  selector: 'app-tutorial-card',
  standalone: true,
  imports: [NgClass],
  templateUrl: './tutorial-card.html',
})
export class TutorialCardComponent {
  // Ahora recibimos el objeto de tutorial completo
  @Input({ required: true }) tutorial!: Tutorial;
  @Output() open = new EventEmitter<Tutorial>();

  // Extraemos la imagen del primer paso que contenga una
  get coverImage(): string | null {
    if (this.tutorial.steps && this.tutorial.steps.length > 0) {
      const stepWithImage = this.tutorial.steps.find((step) => step.mediaUrl);
      return stepWithImage ? stepWithImage.mediaUrl : null;
    }
    return null;
  }

  // Colores según la dificultad del modelo de tutoriales
  get difficultyColorClass(): string {
    switch (this.tutorial.difficultyLevel) {
      case 'Principiante': // En tu backend se llama Principiante, no Fácil
        return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50';
      case 'Intermedio':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50';
      case 'Avanzado':
        return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  }

  // Formateador de tiempo (Ej: 90 min -> 1h 30m)
  get formattedTime(): string {
    const mins = this.tutorial.estimatedTime || 0;
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  onCardClick() {
    this.open.emit(this.tutorial);
  }
}
