import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { merge, Subscription } from 'rxjs';

import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../shared/models/project.model';
import { ProjectCardComponent } from '../../../shared/components/project-card/project-card';
import { CreateProjectModal } from '../../../shared/modals/create-project/create-project.modal';
import { ToastService } from '../../../core/services/toast.service';

type ViewMode = 'taller' | 'portafolio' | 'tutoriales' | 'comunidad';

@Component({
  selector: 'app-proyectos',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    ProjectCardComponent,
    CreateProjectModal,
  ],
  templateUrl: './proyectos.html',
})
export class Proyectos implements OnInit, OnDestroy {
  private projectService = inject(ProjectService);
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // Estado principal
  projects: Project[] = [];
  isLoading = true;
  activeView: ViewMode = 'taller'; // Por defecto mostramos los borradores propios

  // Controles de filtrado
  searchTerm = new FormControl('');
  statusFilter = new FormControl('Todos');
  difficultyFilter = new FormControl('Todas'); // Nota: el backend actual no filtra por dificultad directamente, habría que añadirlo al service si se quiere filtrado real
  sortByFilter = new FormControl('nuevo');

  // Paginación
  currentPage = 1;
  totalPages = 1;
  totalResults = 0;

  // Control de interfaz
  isCreateModalOpen = false;
  private filterSubscription?: Subscription;

  ngOnInit() {
    this.loadProjects();
    this.setupFilters();
  }

  ngOnDestroy() {
    if (this.filterSubscription) {
      this.filterSubscription.unsubscribe();
    }
  }

  // --- NAVEGACIÓN Y VISTAS ---

  switchView(view: ViewMode) {
    if (this.activeView === view) return;

    this.activeView = view;
    this.currentPage = 1;
    // Limpiamos los filtros al cambiar de contexto para evitar resultados confusos
    this.resetFilters(false);
    this.loadProjects();
  }

  private resetFilters(reload: boolean = true) {
    this.searchTerm.setValue('', { emitEvent: false });
    this.statusFilter.setValue('Todos', { emitEvent: false });
    this.difficultyFilter.setValue('Todas', { emitEvent: false });
    this.sortByFilter.setValue('nuevo', { emitEvent: false });

    if (reload) {
      this.currentPage = 1;
      this.loadProjects();
    }
  }

  private setupFilters() {
    const search$ = this.searchTerm.valueChanges.pipe(debounceTime(400), distinctUntilChanged());
    const status$ = this.statusFilter.valueChanges;
    const difficulty$ = this.difficultyFilter.valueChanges;
    const sort$ = this.sortByFilter.valueChanges;

    this.filterSubscription = merge(search$, status$, difficulty$, sort$).subscribe(() => {
      this.currentPage = 1;
      this.loadProjects();
    });
  }

  // --- CARGA DE DATOS ---

  loadProjects() {
    this.isLoading = true;
    this.cdr.markForCheck();

    const search = this.searchTerm.value || '';
    const status = this.statusFilter.value || 'Todos';
    const sortBy = this.sortByFilter.value || 'nuevo';

    // Determinamos qué pedirle al backend basándonos en la pestaña activa
    let projectType: string | undefined = undefined;
    let isPublic: boolean | undefined = undefined;

    switch (this.activeView) {
      case 'taller':
        // Mis borradores: Proyectos creados por mí que NO son públicos
        projectType = 'Nuevo';
        isPublic = false;
        break;
      case 'portafolio':
        // Mis publicaciones: Proyectos creados por mí que SÍ son públicos
        projectType = 'Nuevo';
        isPublic = true;
        break;
      case 'tutoriales':
        // Clonados de tutoriales
        projectType = 'Comenzado desde Tutorial';
        isPublic = false; // Los clones siempre son privados
        break;
      case 'comunidad':
        // Clonados de la comunidad
        projectType = 'Adaptado de la Comunidad';
        isPublic = false; // Los clones siempre son privados
        break;
    }

    // Petición al backend con todos los filtros correctos aplicados
    this.projectService
      .getMyProjects(this.currentPage, 9, status, sortBy, search, projectType, isPublic)
      .subscribe({
        next: (response) => {
          if (response.data) {
            let fetchedDocs = response.data.docs;

            // Filtro local de dificultad (Idealmente esto debería hacerlo el backend)
            const difficulty = this.difficultyFilter.value || 'Todas';
            if (difficulty !== 'Todas') {
              fetchedDocs = fetchedDocs.filter((p: Project) => p.difficulty === difficulty);
            }

            this.projects = fetchedDocs;
            this.totalPages = response.data.totalPages;
            this.totalResults = response.data.totalDocs;
          } else {
            this.projects = [];
            this.totalPages = 1;
            this.totalResults = 0;
          }

          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error cargando proyectos:', err);
          this.projects = [];
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  // --- ACCIONES DE PROYECTO ---

  openCreateModal() {
    this.isCreateModalOpen = true;
  }

  handleProjectCreated(project: Project) {
    this.isCreateModalOpen = false;
    this.router.navigate(['/home/proyectos', project._id, 'edit']);
  }

  deleteProject(id: string) {
    this.projectService.deleteProject(id).subscribe({
      next: () => {
        if (this.projects.length === 1 && this.currentPage > 1) {
          this.currentPage--;
        }
        this.loadProjects();
        this.toastService.success('El diseño ha sido eliminado correctamente.');
      },
      error: (err) => {
        console.error('Error al eliminar:', err);
        this.toastService.error('Hubo un problema al eliminar el proyecto. Inténtalo de nuevo.');
      },
    });
  }

  // --- VALIDACIÓN Y VISIBILIDAD ---

  isProjectComplete(project: Project): boolean {
    const hasImage = !!project.inspirationImageUrl;
    const hasMaterials = project.materials && project.materials.length > 0;
    const hasSteps = project.steps && project.steps.length > 0;
    return hasImage && hasMaterials && hasSteps;
  }

  toggleProjectVisibility(project: Project) {
    const isCurrentlyPublic = project.isPublic;

    // Validación antes de publicar
    if (!isCurrentlyPublic && !this.isProjectComplete(project)) {
      this.toastService.warning('El proyecto debe tener foto, materiales y pasos para publicarse.');
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    const payload = { isPublic: !isCurrentlyPublic };

    this.projectService.updateProject(project._id, payload).subscribe({
      next: () => {
        const message = isCurrentlyPublic
          ? 'Proyecto retirado de la comunidad. Ahora es privado.'
          : '¡Proyecto publicado! Ya es visible para la comunidad.';

        this.toastService.success(message);
        this.loadProjects();
      },
      error: (err) => {
        console.error('Error actualizando visibilidad:', err);
        this.toastService.error('Error al actualizar el estado del proyecto.');
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  // --- PAGINACIÓN ---

  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.currentPage = newPage;
      this.loadProjects();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
