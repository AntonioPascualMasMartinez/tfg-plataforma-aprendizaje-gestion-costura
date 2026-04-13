/**
 * @file proyectos.ts
 * @description Componente gestor del área de trabajo principal del usuario.
 * Coordina la visualización, filtrado y administración del ciclo de vida de los proyectos personales.
 * Segmenta la información en múltiples contextos de negocio (taller, portafolio, adaptaciones)
 * apoyándose en formularios reactivos para consultas dinámicas al servidor.
 */
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

/** Definición tipada de los contextos de visualización disponibles en el área de trabajo. */
type ViewMode = 'todo' | 'borradores' | 'publicados' | 'tutoriales' | 'comunidad';

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
  /* Inyección de dependencias para servicios de datos, notificaciones y enrutamiento */
  private projectService = inject(ProjectService);
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);
  private router = inject(Router);

  /** Colección activa de proyectos renderizados en la vista actual */
  projects: Project[] = [];
  isLoading = true;
  /** Contexto de navegación inicial establecido en el área de desarrollo privado */
  activeView: ViewMode = 'todo';

  /* Controles reactivos para el motor de filtrado y ordenación */
  searchTerm = new FormControl('');
  statusFilter = new FormControl('Todos');
  difficultyFilter = new FormControl('Todas');
  sortByFilter = new FormControl('nuevo');

  /* Metadatos de paginación del lado del servidor */
  currentPage = 1;
  totalPages = 1;
  totalResults = 0;

  /** Estado de despliegue de la ventana modal de creación */
  isCreateModalOpen = false;
  /** Referencia de suscripción para prevenir fugas de memoria del sistema de filtros */
  private filterSubscription?: Subscription;

  ngOnInit(): void {
    this.loadProjects();
    this.setupFilters();
  }

  ngOnDestroy(): void {
    if (this.filterSubscription) {
      this.filterSubscription.unsubscribe();
    }
  }

  /* ==========================================================================
     MÉTODOS DE ORQUESTACIÓN DE VISTAS Y FILTROS
     ========================================================================== */

  /**
   * Ejecuta la transición entre contextos de visualización del área de trabajo.
   * Purga el estado de los filtros para evitar cruces de datos inconsistentes.
   * @param view Identificador del nuevo contexto a cargar.
   */
  switchView(view: ViewMode): void {
    if (this.activeView === view) return;

    this.activeView = view;
    this.currentPage = 1;
    this.resetFilters(false);
    this.loadProjects();
  }

  /**
   * Restablece los valores por defecto de los controles de filtrado.
   * @param reload Determina si se debe desencadenar una nueva petición de red tras el reseteo.
   */
  private resetFilters(reload: boolean = true): void {
    this.searchTerm.setValue('', { emitEvent: false });
    this.statusFilter.setValue('Todos', { emitEvent: false });
    this.difficultyFilter.setValue('Todas', { emitEvent: false });
    this.sortByFilter.setValue('nuevo', { emitEvent: false });

    if (reload) {
      this.currentPage = 1;
      this.loadProjects();
    }
  }

  /**
   * Configura la topología reactiva para escuchar cambios en los parámetros de búsqueda.
   * Implementa retardos (debounce) en la entrada de texto para optimizar el tráfico de red.
   */
  private setupFilters(): void {
    const search$ = this.searchTerm.valueChanges.pipe(debounceTime(400), distinctUntilChanged());
    const status$ = this.statusFilter.valueChanges;
    const difficulty$ = this.difficultyFilter.valueChanges;
    const sort$ = this.sortByFilter.valueChanges;

    this.filterSubscription = merge(search$, status$, difficulty$, sort$).subscribe(() => {
      this.currentPage = 1;
      this.loadProjects();
    });
  }

  /* ==========================================================================
     MÉTODOS DE ACCESO A DATOS (Integración con API)
     ========================================================================== */

  /**
   * Compone y ejecuta la petición al servidor evaluando el estado de la vista activa
   * y los parámetros definidos en los controles de filtrado.
   */
  loadProjects(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    const search = this.searchTerm.value || '';
    const status = this.statusFilter.value || 'Todos';
    const sortBy = this.sortByFilter.value || 'nuevo';

    let projectType: string | undefined = undefined;
    let isPublic: boolean | undefined = undefined;

    // 3. Actualiza el switch con las nuevas reglas de negocio
    switch (this.activeView) {
      case 'todo':
        projectType = undefined;
        isPublic = undefined;
        break;
      case 'publicados':
        projectType = 'Nuevo';
        isPublic = true;
        break;
      case 'borradores':
        projectType = 'Nuevo';
        isPublic = false;
        break;
      case 'tutoriales':
        projectType = 'Comenzado desde Tutorial';
        isPublic = undefined;
        break;
      case 'comunidad':
        projectType = 'Adaptado de la Comunidad';
        isPublic = undefined;
        break;
    }
    this.projectService
      .getMyProjects(this.currentPage, 9, status, sortBy, search, projectType, isPublic)
      .subscribe({
        next: (response) => {
          if (response.data) {
            let fetchedDocs = response.data.docs;
            console.log('Proyectos recuperados del servidor:', fetchedDocs);
            /* Procesamiento local complementario para el filtrado por dificultad */
            const difficulty = this.difficultyFilter.value || 'Todas';
            if (difficulty !== 'Todas') {
              fetchedDocs = fetchedDocs.filter((p: Project) => p.difficulty === difficulty);
            }

            /* -------------------------------------------------------------
               NUEVO: Procesamiento local de seguridad para isPublic 
               ------------------------------------------------------------- */
            if (isPublic !== undefined) {
              fetchedDocs = fetchedDocs.filter((p: Project) => p.isPublic === isPublic);
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
          console.error('Anomalía en la recuperación del repositorio de proyectos:', err);
          this.projects = [];
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  /* ==========================================================================
     OPERACIONES TRANSACCIONALES (CRUD)
     ========================================================================== */

  openCreateModal(): void {
    this.isCreateModalOpen = true;
  }

  /**
   * Cierra el diálogo de inicialización y enruta al usuario al editor de detalles
   * tras la instanciación exitosa de un nuevo proyecto en la base de datos.
   */
  handleProjectCreated(project: Project): void {
    this.isCreateModalOpen = false;
    this.router.navigate(['/home/proyectos', project._id, 'edit']);
  }

  /**
   * Remueve permanentemente un proyecto del sistema.
   * Realiza un ajuste algorítmico sobre la paginación si se elimina el último elemento de una página.
   * @param id Identificador único de la entidad a eliminar.
   */
  deleteProject(id: string): void {
    this.projectService.deleteProject(id).subscribe({
      next: () => {
        if (this.projects.length === 1 && this.currentPage > 1) {
          this.currentPage--;
        }
        this.loadProjects();
        this.toastService.success('El diseño ha sido eliminado correctamente.');
      },
      error: (err) => {
        console.error('Fallo en la operación de borrado:', err);
        this.toastService.error('Hubo un problema al eliminar el proyecto. Inténtalo de nuevo.');
      },
    });
  }

  /* ==========================================================================
     LÓGICA DE VALIDACIÓN Y VISIBILIDAD (Reglas de Negocio)
     ========================================================================== */

  /**
   * Evalúa la integridad estructural de un proyecto garantizando que cumple
   * los requisitos mínimos para su publicación en el ecosistema comunitario.
   */
  isProjectComplete(project: Project): boolean {
    const hasImage = !!project.inspirationImageUrl;
    const hasMaterials = project.materials && project.materials.length > 0;
    const hasSteps = project.steps && project.steps.length > 0;
    return hasImage && hasMaterials && hasSteps;
  }

  /**
   * Conmuta el estado de privacidad del proyecto previa validación de requisitos.
   * Restringe la propagación a la comunidad si la entidad está incompleta.
   */
  toggleProjectVisibility(project: Project): void {
    const isCurrentlyPublic = project.isPublic;

    if (!isCurrentlyPublic && !this.isProjectComplete(project)) {
      this.toastService.warning(
        'El proyecto debe contener una imagen de portada, listado de materiales y al menos un paso para autorizar su publicación.',
      );
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    const payload = { isPublic: !isCurrentlyPublic };

    this.projectService.updateProject(project._id, payload).subscribe({
      next: () => {
        const message = isCurrentlyPublic
          ? 'Proyecto retirado de la comunidad. Restablecido como ámbito privado.'
          : '¡Proyecto publicado! La estructura es ahora visible para la comunidad global.';

        this.toastService.success(message);
        this.loadProjects();
      },
      error: (err) => {
        console.error('Inconsistencia al transaccionar el estado de visibilidad:', err);
        this.toastService.error('Error al actualizar el estado de exposición del proyecto.');
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  /* ==========================================================================
     MÉTODOS DE PAGINACIÓN ALGORÍTMICA
     ========================================================================== */

  changePage(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.currentPage = newPage;
      this.loadProjects();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
