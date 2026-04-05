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

  ngOnInit() {
    this.loadPrivateProjects();
  }

  loadPrivateProjects() {
    this.isLoading = true;
    // Pedimos un límite alto para asegurar que traemos sus proyectos recientes
    this.projectService.getMyProjects(1, 50).subscribe({
      next: (response) => {
        // Filtramos solo los que NO son públicos
        this.privateProjects = response.data.docs.filter(p => !p.isPublic);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar tus proyectos. Inténtalo de nuevo.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Validación: Un proyecto debe tener foto, materiales y pasos para ser público
  isProjectReady(project: Project): boolean {
    const hasImage = !!project.inspirationImageUrl;
    const hasMaterials = project.materials && project.materials.length > 0;
    const hasSteps = project.steps && project.steps.length > 0;
    return hasImage && hasMaterials && hasSteps;
  }

  selectProject(projectId: string, isReady: boolean) {
    if (!isReady) return;
    this.selectedProjectId = projectId;
  }

  closeModal() {
    this.close.emit();
  }

  publishSelectedProject() {
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
      }
    });
  }
}