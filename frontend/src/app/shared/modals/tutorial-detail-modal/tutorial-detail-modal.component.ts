/**
 * @file tutorial-detail-modal.component.ts
 * @description Componente modal encargado de presentar la ficha detallada de una unidad didáctica (Tutorial).
 * Intermedia entre el catálogo formativo y la instanciación de un nuevo proyecto derivado,
 * gestionando la llamada al servicio de clonación y la posterior redirección al entorno de trabajo.
 */
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
  /** Entidad del tutorial seleccionada para su visualización. */
  @Input({ required: true }) tutorial!: Tutorial;

  /** Evento emitido para notificar al componente contenedor la solicitud de cierre de la vista. */
  @Output() close = new EventEmitter<void>();

  private tutorialService = inject(TutorialService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  /** Bandera de estado para el control de la interfaz durante peticiones asíncronas. */
  isLoading = false;

  /**
   * Propiedad computada que extrae la imagen de portada representativa.
   * Itera la colección de pasos en orden inverso para priorizar la visualización
   * del resultado final del tutorial.
   * @returns {string | null} URL del activo multimedia o nulo si carece de él.
   */
  get coverImage(): string | null {
    if (this.tutorial.steps && this.tutorial.steps.length > 0) {
      const stepWithImage = [...this.tutorial.steps].reverse().find((step) => step.mediaUrl);
      return stepWithImage ? stepWithImage.mediaUrl : null;
    }
    return null;
  }

  /**
   * Formatea la duración estimada de la unidad didáctica a un formato legible por el usuario.
   * @returns {string} Cadena de texto con formato (ej. "1h 30m").
   */
  get formattedTime(): string {
    const mins = this.tutorial.estimatedTime || 0;
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  /**
   * Asigna dinámicamente clases utilitarias de Tailwind CSS según el nivel de complejidad del tutorial.
   * @returns {string} Cadena con las clases de estilo correspondientes.
   */
  get difficultyColorClass(): string {
    switch (this.tutorial.difficultyLevel) {
      case 'Principiante':
        // Fondo verde súper claro, texto verde súper oscuro
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Intermedio':
        // Fondo amarillo/naranja súper claro, texto naranja súper oscuro
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Avanzado':
        // Fondo rojo súper claro, texto rojo súper oscuro
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-surface text-text-main border-border-main/20';
    }
  }

  /**
   * Gestiona el cierre del componente previniendo la interrupción de procesos en curso.
   */
  closeModal(): void {
    if (!this.isLoading) {
      this.close.emit();
    }
  }

  /**
   * Invoca el endpoint de vinculación para iniciar la formación.
   * Efectúa el control de flujo transaccional y la redirección programática
   * al nuevo entorno de proyecto generado (Clon).
   */
  startTutorial(): void {
    this.isLoading = true;
    this.tutorialService.startTutorial(this.tutorial._id).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.toastService.success('¡Tutorial iniciado! Preparando tu mesa de trabajo...');

        /* Extracción del identificador del proyecto clonado y navegación hacia el taller inmersivo */
        const newProjectId = response.data.clonedProject._id;
        this.closeModal();
        this.router.navigate(['/home/proyectos', newProjectId]);
      },
      error: (err) => {
        console.error('Excepción capturada durante la inicialización del tutorial:', err);
        this.isLoading = false;

        const errorMessage = err.error?.message?.toLowerCase() || '';

        /* Manejo de contingencia: Redirección condicional si el usuario ya posee un clon activo de la unidad */
        if (
          errorMessage.includes('iniciado') ||
          errorMessage.includes('ya existe') ||
          err.status === 400
        ) {
          this.toastService.info('Ya estabas realizando este tutorial. Abriendo tu taller...');
          this.closeModal();
          this.router.navigate(['/home/proyectos']);
        } else {
          this.toastService.error('Error al preparar el tutorial. Por favor, intenta de nuevo.');
        }
      },
    });
  }
}
