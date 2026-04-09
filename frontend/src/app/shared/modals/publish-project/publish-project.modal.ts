/**
 * @file publish-project.modal.ts
 * @description Interfaz modal para la transición de visibilidad de proyectos (Privado a Público).
 * Implementa lógica de validación de negocio, requiriendo que los proyectos cumplan
 * un estándar mínimo de calidad (multimedia, materiales, pasos) antes de ser expuestos al feed general.
 */
import { Component, EventEmitter, Output, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../models/project.model';

@Component({
  selector: 'app-publish-project-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './publish-project.modal.html',
})
export class PublishProjectModal implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() projectPublished = new EventEmitter<Project>();

  private projectService = inject(ProjectService);
  private cdr = inject(ChangeDetectorRef);

  isLoading = true;
  isPublishing = false;
  errorMessage = '';

  privateProjects: Project[] = [];
  selectedProjectId: string | null = null;

  ngOnInit(): void {
    this.loadPrivateProjects();
  }

  /**
   * Recupera el repositorio personal del usuario e inicializa el modelo de datos.
   */
  loadPrivateProjects(): void {
    this.isLoading = true;

    this.projectService.getMyProjects(1, 50).subscribe({
      next: (response) => {
        /* Aplicación de filtrado en el cliente para aislar estrictamente los proyectos privados */
        this.privateProjects = response.data.docs.filter((p) => !p.isPublic);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar tus proyectos. Inténtalo de nuevo.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Evalúa las reglas de negocio para determinar si un proyecto es elegible para publicación.
   * @param {Project} project - Instancia del proyecto a evaluar.
   * @returns {boolean} Cumplimiento de los requisitos de completitud funcional.
   */
  isProjectReady(project: Project): boolean {
    const hasImage = !!project.inspirationImageUrl;
    const hasMaterials = project.materials && project.materials.length > 0;
    const hasSteps = project.steps && project.steps.length > 0;
    return hasImage && hasMaterials && hasSteps;
  }

  /**
   * Registra en el estado la intención de publicación sobre un proyecto concreto.
   * @param {string} projectId - Identificador único del proyecto.
   * @param {boolean} isReady - Indicador de cumplimiento de criterios.
   */
  selectProject(projectId: string, isReady: boolean): void {
    if (!isReady) return;
    this.selectedProjectId = projectId;
  }

  closeModal(): void {
    this.close.emit();
  }

  /**
   * Ejecuta la mutación del estado de visibilidad en el backend.
   */
  publishSelectedProject(): void {
    if (!this.selectedProjectId) return;

    this.isPublishing = true;
    this.errorMessage = '';

    this.projectService.updateProject(this.selectedProjectId, { isPublic: true }).subscribe({
      next: (response) => {
        this.isPublishing = false;
        this.projectPublished.emit(response.data);
        this.closeModal();
      },
      error: (err) => {
        this.isPublishing = false;
        this.errorMessage = err.error?.message || 'Error al publicar el proyecto.';
        this.cdr.detectChanges();
      },
    });
  }
}
