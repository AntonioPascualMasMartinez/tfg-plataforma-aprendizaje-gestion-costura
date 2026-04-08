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
    RouterLink,
    ReactiveFormsModule,
    CommunityCardComponent,
    CommunityDetailModalComponent,
    ReportModalComponent,
  ],
  templateUrl: './comunidad.html',
  styleUrl: './comunidad.scss',
})
export class Comunidad implements OnInit, OnDestroy {
  private projectService = inject(ProjectService);
  private communityService = inject(CommunityService);
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);

  // --- ESTADOS DE DATOS ---
  featuredProject: CommunityProject | null = null;
  gridProjects: CommunityProject[] = [];
  projectToReport: CommunityProject | null = null;
  selectedProject: CommunityProject | null = null;

  // --- PAGINACIÓN ---
  currentPage = 1;
  totalPages = 1;
  limit = 13; // 1 Destacado + 12 para el Grid (en la página 1)

  isLoading = true;
  currentUserId: string | null = null;

  // --- FILTROS INTERACTIVOS ---
  searchTerm = new FormControl('');
  categoryFilter = new FormControl('Todas');
  difficultyFilter = new FormControl('Todas');
  sortByFilter = new FormControl('populares');

  readonly categories = ['Todas', 'Bolsos', 'Monederos', 'Ropa', 'Hogar', 'Accesorios'];
  readonly difficulties = ['Todas', 'Fácil', 'Intermedio', 'Avanzado'];

  private filterSub?: Subscription;

  ngOnInit() {
    this.userService.getMe().subscribe({
      next: (res) => {
        this.currentUserId = res.data._id;
        this.initFeed();
      },
      error: () => {
        this.initFeed(); // Cargar como invitado si falla
      },
    });
  }

  ngOnDestroy() {
    if (this.filterSub) {
      this.filterSub.unsubscribe();
    }
  }

  private initFeed() {
    this.setupFilters();
    this.loadFeed();
  }

  private setupFilters() {
    const search$ = this.searchTerm.valueChanges.pipe(debounceTime(400), distinctUntilChanged());
    const cat$ = this.categoryFilter.valueChanges;
    const diff$ = this.difficultyFilter.valueChanges;
    const sort$ = this.sortByFilter.valueChanges;

    // Escuchamos cualquier cambio en cualquier filtro para resetear la página a 1 y recargar
    this.filterSub = merge(search$, cat$, diff$, sort$).subscribe(() => {
      this.currentPage = 1;
      this.loadFeed();
    });
  }

  loadFeed() {
    this.isLoading = true;
    this.cdr.detectChanges();

    const search = this.searchTerm.value || '';

    // Llamada al backend (Asumiendo la firma actual de tu Angular Service)
    this.projectService.getPublicFeed(this.currentPage, this.limit, search).subscribe({
      next: (response) => {
        let fetchedDocs = response.data.docs as CommunityProject[];

        // 1. Cálculos de Likes (necesario antes de ordenar)
        fetchedDocs.forEach((p) => {
          p.likesCount = p.likes ? p.likes.length : 0;
          p.isLikedLocally =
            this.currentUserId && p.likes ? p.likes.includes(this.currentUserId) : false;
        });

        // 2. Filtros Locales Temporales
        // *Nota: Idealmente esto debería pasarse como parámetro en getPublicFeed hacia el backend*
        const cat = this.categoryFilter.value;
        if (cat !== 'Todas') {
          fetchedDocs = fetchedDocs.filter((p) => p.category === cat);
        }

        const diff = this.difficultyFilter.value;
        if (diff !== 'Todas') {
          fetchedDocs = fetchedDocs.filter((p) => p.difficulty === diff);
        }

        // 3. Ordenamiento
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

        // 4. Lógica del Destacado Inteligente
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
        console.error('Error cargando el feed', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  // --- PAGINACIÓN ---
  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.currentPage = newPage;
      this.loadFeed();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // --- INTERACCIONES ---
  handleLike(payload: { project: CommunityProject; event: Event }) {
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
        // Reversión optimista en caso de error
        project.isLikedLocally = wasLiked;
        project.likesCount = (project.likesCount || 0) + (wasLiked ? 1 : -1);
        this.cdr.detectChanges();
      },
    });
  }

  handleReport(payload: { project: CommunityProject; event: Event }) {
    payload.event.stopPropagation();
    payload.event.preventDefault();
    this.projectToReport = payload.project;
  }

  handleProjectUpdated(updatedProject: CommunityProject) {
    // Buscar si el proyecto actualizado es el destacado
    if (this.featuredProject && this.featuredProject._id === updatedProject._id) {
      this.featuredProject = updatedProject;
    } else {
      // Si no, buscar en el grid
      const index = this.gridProjects.findIndex((p) => p._id === updatedProject._id);
      if (index !== -1) {
        this.gridProjects[index] = updatedProject;
      }
    }
    this.cdr.detectChanges();
  }

  openModal(project: CommunityProject) {
    this.selectedProject = project;
  }

  closeModal() {
    this.selectedProject = null;
  }

  onReportSubmitted(payload: CreateReportPayload) {
    this.communityService.createReport(payload).subscribe({
      next: () => {
        this.toastService.success('Proyecto reportado correctamente. Gracias por ayudarnos.');
        this.projectToReport = null;
      },
      error: (err) => {
        console.error('Error al reportar', err);
        this.toastService.error('Hubo un error al enviar el reporte.');
      },
    });
  }
}
