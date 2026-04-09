/**
 * @file comunidad.ts
 * @description Componente principal del feed de la comunidad.
 * Gestiona la visualización de proyectos públicos, integrando capacidades de filtrado dinámico,
 * búsqueda reactiva, paginación y gestión de interacciones sociales (likes y reportes).
 */
import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { merge, Subscription } from 'rxjs';

import { ProjectService } from '../../../core/services/project.service';
import { CommunityService } from '../../../core/services/community.service';
import { UserService } from '../../../core/services/user.service';
import {
  CommunityCardComponent,
  CommunityProject,
} from '../../../shared/components/community-card/community-card.component';
import { CommunityDetailModalComponent } from '../../../shared/modals/community-detail-modal/community-detail-modal.component';

import { CreateReportPayload } from '../../../shared/models/community.model';
import { ReportModalComponent } from '../../../shared/modals/report-modal/report-modal.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-comunidad',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CommunityCardComponent,
    CommunityDetailModalComponent,
    ReportModalComponent,
  ],
  templateUrl: './comunidad.html',
  styleUrl: './comunidad.scss',
})
export class Comunidad implements OnInit, OnDestroy {
  /* Inyección de servicios mediante el patrón Functional Inject de Angular */
  private projectService = inject(ProjectService);
  private communityService = inject(CommunityService);
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);

  /** Referencia al proyecto destacado (normalmente el más reciente o relevante) */
  featuredProject: CommunityProject | null = null;
  /** Colección de proyectos destinados a la visualización en cuadrícula */
  gridProjects: CommunityProject[] = [];
  /** Estado de control para el modal de reportes */
  projectToReport: CommunityProject | null = null;
  /** Referencia para el detalle expandido de un proyecto */
  selectedProject: CommunityProject | null = null;

  /* Atributos de control de paginación y estado de carga */
  currentPage = 1;
  totalPages = 1;
  limit = 13;
  isLoading = true;
  currentUserId: string | null = null;

  /* Controles reactivos para el filtrado de la interfaz */
  searchTerm = new FormControl('');
  categoryFilter = new FormControl('Todas');
  difficultyFilter = new FormControl('Todas');
  sortByFilter = new FormControl('populares');

  /* Definiciones constantes para los selectores de la vista */
  readonly categories = ['Todas', 'Bolsos', 'Monederos', 'Ropa', 'Hogar', 'Accesorios'];
  readonly difficulties = ['Todas', 'Fácil', 'Intermedio', 'Avanzado'];

  /** Suscripción única para la gestión de múltiples flujos de entrada (filtros) */
  private filterSub?: Subscription;

  ngOnInit() {
    this.identifyUserContext();
  }

  ngOnDestroy() {
    if (this.filterSub) {
      this.filterSub.unsubscribe();
    }
  }

  /**
   * Determina el contexto de identidad del usuario para personalizar la experiencia
   * (detección de likes propios) antes de inicializar el feed.
   */
  private identifyUserContext(): void {
    this.userService.getMe().subscribe({
      next: (res) => {
        this.currentUserId = res.data._id;
        this.initFeed();
      },
      error: () => {
        this.initFeed(); // Carga en modo invitado ante ausencia de sesión
      },
    });
  }

  /**
   * Inicializa la configuración de observadores y ejecuta la carga inicial de datos.
   */
  private initFeed(): void {
    this.setupFilters();
    this.loadFeed();
  }

  /**
   * Configura la lógica reactiva para los filtros. Implementa técnicas de
   * 'debounce' para optimizar las peticiones de búsqueda y combina flujos mediante 'merge'.
   */
  private setupFilters(): void {
    const search$ = this.searchTerm.valueChanges.pipe(debounceTime(400), distinctUntilChanged());
    const cat$ = this.categoryFilter.valueChanges;
    const diff$ = this.difficultyFilter.valueChanges;
    const sort$ = this.sortByFilter.valueChanges;

    this.filterSub = merge(search$, cat$, diff$, sort$).subscribe(() => {
      this.currentPage = 1;
      this.loadFeed();
    });
  }

  /**
   * Sincroniza el estado del componente con el servidor mediante el servicio de proyectos.
   * Realiza un post-procesamiento de los datos para gestionar la lógica de likes,
   * ordenamiento local y asignación del proyecto destacado.
   */
  loadFeed(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    const search = this.searchTerm.value || '';

    this.projectService.getPublicFeed(this.currentPage, this.limit, search).subscribe({
      next: (response) => {
        let fetchedDocs = response.data.docs as CommunityProject[];

        // Procesamiento de metadatos de interacción
        fetchedDocs.forEach((p) => {
          p.likesCount = p.likes ? p.likes.length : 0;
          p.isLikedLocally =
            this.currentUserId && p.likes ? p.likes.includes(this.currentUserId) : false;
        });

        // Aplicación de lógica de filtrado complementaria en cliente
        const cat = this.categoryFilter.value;
        if (cat !== 'Todas') {
          fetchedDocs = fetchedDocs.filter((p) => p.category === cat);
        }

        const diff = this.difficultyFilter.value;
        if (diff !== 'Todas') {
          fetchedDocs = fetchedDocs.filter((p) => p.difficulty === diff);
        }

        // Resolución del criterio de ordenación seleccionado
        const sortBy = this.sortByFilter.value;
        if (sortBy === 'populares') {
          fetchedDocs.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
        } else {
          fetchedDocs.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
        }

        this.totalPages = response.data.totalPages || 1;
        this.currentPage = response.data.page || 1;

        // Distribución de la jerarquía visual de los proyectos
        const isFiltering = search !== '' || cat !== 'Todas' || diff !== 'Todas';
        if (this.currentPage === 1 && !isFiltering && fetchedDocs.length > 0) {
          this.featuredProject = fetchedDocs[0];
          this.gridProjects = fetchedDocs.slice(1);
        } else {
          this.featuredProject = null;
          this.gridProjects = fetchedDocs;
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error en la recuperación del feed:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Gestiona el cambio de página y desplaza el scroll a la posición inicial.
   * @param newPage Índice de la página solicitada.
   */
  changePage(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.currentPage = newPage;
      this.loadFeed();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Ejecuta la lógica de interacción para el sistema de likes.
   * Implementa una actualización optimista en la UI antes de la confirmación del servidor.
   */
  handleLike(payload: { project: CommunityProject; event: Event }): void {
    const { project, event } = payload;
    event.stopPropagation();
    event.preventDefault();

    const wasLiked = project.isLikedLocally;
    project.isLikedLocally = !wasLiked;
    project.likesCount = (project.likesCount || 0) + (wasLiked ? -1 : 1);

    this.communityService.likeProject(project._id).subscribe({
      next: (response) => {
        project.likesCount = response.data.likesCount;
        project.isLikedLocally = response.data.isLikedByMe;
        this.cdr.detectChanges();
      },
      error: () => {
        // Reversión del estado ante fallo en la transacción asíncrona
        project.isLikedLocally = wasLiked;
        project.likesCount = (project.likesCount || 0) + (wasLiked ? 1 : -1);
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Prepara la entidad del proyecto para ser procesada por el módulo de reportes.
   */
  handleReport(payload: { project: CommunityProject; event: Event }): void {
    payload.event.stopPropagation();
    payload.event.preventDefault();
    this.projectToReport = payload.project;
  }

  /**
   * Sincroniza la instancia local de un proyecto con cambios emitidos por componentes hijos.
   */
  handleProjectUpdated(updatedProject: CommunityProject): void {
    if (this.featuredProject && this.featuredProject._id === updatedProject._id) {
      this.featuredProject = updatedProject;
    } else {
      const index = this.gridProjects.findIndex((p) => p._id === updatedProject._id);
      if (index !== -1) {
        this.gridProjects[index] = updatedProject;
      }
    }
    this.cdr.detectChanges();
  }

  openModal(project: CommunityProject): void {
    this.selectedProject = project;
  }

  closeModal(): void {
    this.selectedProject = null;
  }

  /**
   * Persiste la denuncia de un proyecto en el sistema de moderación.
   * @param payload Estructura de datos que contiene el motivo y contexto del reporte.
   */
  onReportSubmitted(payload: CreateReportPayload): void {
    this.communityService.createReport(payload).subscribe({
      next: () => {
        this.toastService.success('Proyecto reportado correctamente. Gracias por ayudarnos.');
        this.projectToReport = null;
      },
      error: (err) => {
        console.error('Fallo en el envío del reporte:', err);
        this.toastService.error('Hubo un error al enviar el reporte.');
      },
    });
  }
}
