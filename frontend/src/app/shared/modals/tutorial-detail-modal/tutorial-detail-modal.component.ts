import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Tutorial } from '../../../shared/models/tutorial.model';
import { TutorialService } from '../../../core/services/tutorial.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-tutorial-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tutorial-detail-modal.component.html',
})
export class TutorialDetailModalComponent {
  // Recibe el tutorial seleccionado al abrir el modal
  @Input({ required: true }) tutorial!: Tutorial;

  // Evento para avisar al padre que cierre el modal
  @Output() close = new EventEmitter<void>();

  private tutorialService = inject(TutorialService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  isLoading = false;

  /**
   * Obtiene la imagen de portada.
   * Busca en orden inverso (desde el último paso hacia el primero)
   * para mostrar el resultado final del tutorial.
   */
  get coverImage(): string | null {
    if (this.tutorial.steps && this.tutorial.steps.length > 0) {
      const stepWithImage = [...this.tutorial.steps].reverse().find((step) => step.mediaUrl);
      return stepWithImage ? stepWithImage.mediaUrl : null;
    }
    return null;
  }

  get formattedTime(): string {
    const mins = this.tutorial.estimatedTime || 0;
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  get difficultyColorClass(): string {
    switch (this.tutorial.difficultyLevel) {
      case 'Principiante':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50';
      case 'Intermedio':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50';
      case 'Avanzado':
        return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50';
      default:
        return 'bg-surface-hover text-muted border-border-main/20';
    }
  }

  closeModal() {
    if (!this.isLoading) {
      this.close.emit();
    }
  }

  /**
   * Llamada al backend para clonar e iniciar el tutorial
   */
  startTutorial() {
    this.isLoading = true;
    this.tutorialService.startTutorial(this.tutorial._id).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.toastService.success('¡Tutorial iniciado! Preparando tu mesa de trabajo...');

        // El backend devuelve el proyecto clonado, tomamos su ID para redirigir
        const newProjectId = response.data.clonedProject._id;

        // Cerramos el modal y navegamos a la vista inmersiva del Workshop
        this.closeModal();
        this.router.navigate(['/home/proyectos', newProjectId]);
      },
      error: (err) => {
        console.error('Error al iniciar el tutorial:', err);
        this.isLoading = false;

        // Manejo inteligente de error: Si ya lo había iniciado, lo llevamos a su Taller
        const errorMessage = err.error?.message?.toLowerCase() || '';

        if (
          errorMessage.includes('iniciado') ||
          errorMessage.includes('ya existe') ||
          err.status === 400
        ) {
          this.toastService.info('Ya estabas realizando este tutorial. Abriendo tu taller...');
          this.closeModal();
          // Como no tenemos el ID del clon exacto en el error, lo llevamos a la pestaña de sus tutoriales
          this.router.navigate(['/home/proyectos']);
        } else {
          this.toastService.error('Error al preparar el tutorial. Por favor, intenta de nuevo.');
        }
      },
    });
  }
}
