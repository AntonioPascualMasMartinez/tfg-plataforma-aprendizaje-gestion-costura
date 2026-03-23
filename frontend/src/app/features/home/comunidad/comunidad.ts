import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { ProjectService } from '../../../core/services/project.service';
import { CommunityService } from '../../../core/services/community.service';
import { UserService } from '../../../core/services/user.service'; // Asegúrate de importarlo
import {
  CommunityCardComponent,
  CommunityProject,
} from '../../../shared/components/community-card/community-card.component';
import { CommunityDetailModalComponent } from '../../../shared/modals/community-detail-modal/community-detail-modal.component';

@Component({
  selector: 'app-comunidad',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    CommunityCardComponent,
    CommunityDetailModalComponent,
  ],
  templateUrl: './comunidad.html',
  styleUrl: './comunidad.scss',
})
export class Comunidad implements OnInit, OnDestroy {
  private projectService = inject(ProjectService);
  private communityService = inject(CommunityService);
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);

  projects: CommunityProject[] = [];
  currentPage = 1;
  limit = 12;

  isLoading = true;
  isLoadingMore = false;
  hasMore = true;

  searchTerm = new FormControl('');
  private searchSub?: Subscription;

  selectedProject: CommunityProject | null = null;

  // NUEVO: Variable para guardar el ID del usuario actual
  currentUserId: string | null = null;

  ngOnInit() {
    // 1. Primero obtenemos el usuario actual
    this.userService.getMe().subscribe({
      next: (res) => {
        this.currentUserId = res.data._id; // Guardamos el ID
        this.initFeed(); // Iniciamos la carga
      },
      error: () => {
        // Si hay error (ej. token expirado), cargamos el feed igual pero como invitado
        this.initFeed();
      },
    });
  }

  // Método auxiliar para iniciar la búsqueda y el feed una vez tenemos el usuario
  private initFeed() {
    this.setupSearch();
    this.loadFeed(true);
  }

  ngOnDestroy() {
    if (this.searchSub) {
      this.searchSub.unsubscribe();
    }
  }

  private setupSearch() {
    this.searchSub = this.searchTerm.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => {
        this.loadFeed(true);
      });
  }

  loadFeed(reset = false) {
    if (reset) {
      this.currentPage = 1;
      this.isLoading = true;
      this.projects = [];
      this.cdr.detectChanges();
    } else {
      this.isLoadingMore = true;
    }

    const search = this.searchTerm.value || '';

    this.projectService.getPublicFeed(this.currentPage, this.limit, search).subscribe({
      next: (response) => {
        const newProjects = response.data.docs as CommunityProject[];

        newProjects.forEach((p) => {
          // 1. Calculamos el total de likes basado en el tamaño del array
          p.likesCount = p.likes ? p.likes.length : 0;

          // 2. Comprobamos si el ID del usuario actual existe dentro del array de likes
          p.isLikedLocally =
            this.currentUserId && p.likes ? p.likes.includes(this.currentUserId) : false;
        });

        if (reset) {
          this.projects = newProjects;
        } else {
          this.projects = [...this.projects, ...newProjects];
        }

        this.hasMore = response.data.hasNextPage ?? newProjects.length === this.limit;
        this.isLoading = false;
        this.isLoadingMore = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando el feed', err);
        this.isLoading = false;
        this.isLoadingMore = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadMore() {
    if (this.hasMore && !this.isLoadingMore) {
      this.currentPage++;
      this.loadFeed();
    }
  }

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
        // Sincronizamos localmente para evitar desfases
        project.isLikedLocally = response.data.isLikedByMe;
        this.cdr.detectChanges();
      },
      error: () => {
        project.isLikedLocally = wasLiked;
        project.likesCount = (project.likesCount || 0) + (wasLiked ? 1 : -1);
        this.cdr.detectChanges();
      },
    });
  }

  handleProjectUpdated(updatedProject: CommunityProject) {
    const index = this.projects.findIndex((p) => p._id === updatedProject._id);
    if (index !== -1) {
      this.projects[index] = updatedProject;
      this.cdr.detectChanges();
    }
  }

  openModal(project: CommunityProject) {
    this.selectedProject = project;
  }

  closeModal() {
    this.selectedProject = null;
  }
}
