/**
 * @file tutorial-card.ts
 * @description Componente presentacional encargado de sintetizar la información de un recurso formativo.
 * Incluye lógica de cálculo temporal y jerarquización de activos multimedia para optimizar
 * el reconocimiento visual del resultado final del tutorial.
 */
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgClass } from '@angular/common';
import { Tutorial } from '../../../shared/models/tutorial.model';

@Component({
  selector: 'app-tutorial-card',
  standalone: true,
  imports: [NgClass],
  templateUrl: './tutorial-card.html',
})
export class TutorialCardComponent {
  /** Estructura de datos completa correspondiente a la unidad didáctica. */
  @Input({ required: true }) tutorial!: Tutorial;

  /** Evento emitido ante la interacción de apertura o visualización detallada. */
  @Output() open = new EventEmitter<Tutorial>();

  /**
   * Computa la imagen representativa del tutorial procesando el flujo formativo.
   * La iteración se realiza en sentido inverso para exponer preferentemente el resultado final del aprendizaje.
   * @returns {string | null} Enlace al recurso multimedia o nulo.
   */
  get coverImage(): string | null {
    if (this.tutorial.steps && this.tutorial.steps.length > 0) {
      const stepWithImage = [...this.tutorial.steps].reverse().find((step) => step.mediaUrl);
      return stepWithImage ? stepWithImage.mediaUrl : null;
    }
    return null;
  }

  /**
   * Resuelve el esquema de color adecuado garantizando el contraste visual
   * en función de la exigencia técnica (dificultad) del módulo.
   */
  get difficultyColorClass(): string {
    switch (this.tutorial.difficultyLevel) {
      case 'Principiante':
        return 'bg-white text-emerald-700 border-emerald-200 dark:bg-surface dark:text-emerald-400 dark:border-emerald-800/60';
      case 'Intermedio':
        return 'bg-white text-amber-700 border-amber-200 dark:bg-surface dark:text-amber-400 dark:border-amber-800/60';
      case 'Avanzado':
        return 'bg-white text-rose-700 border-rose-200 dark:bg-surface dark:text-rose-400 dark:border-rose-800/60';
      default:
        return 'bg-white text-gray-700 border-gray-200 dark:bg-surface dark:text-gray-300 dark:border-gray-700/60';
    }
  }

  /**
   * Formateador semántico para la presentación de tiempos de ejecución de sistema sexagesimal a formato legible.
   * @example 90 -> "1h 30m"
   * @returns {string} Cadena textual con la estimación temporal.
   */
  get formattedTime(): string {
    const mins = this.tutorial.estimatedTime || 0;
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  onCardClick(): void {
    this.open.emit(this.tutorial);
  }
}
