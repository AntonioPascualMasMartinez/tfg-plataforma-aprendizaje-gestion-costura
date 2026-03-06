import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service';
import { CommunityService } from '../../../core/services/community.service';
import {
  CommunityCardComponent,
  CommunityProject,
} from '../../../shared/components/community-card/community-card.component'; // <-- NUEVO

@Component({
  selector: 'app-comunidad',
  standalone: true,
  imports: [RouterLink, FormsModule, CommunityCardComponent], // <-- AÑADIR A IMPORTS
  templateUrl: './comunidad.html',
  styleUrl: './comunidad.scss',
})
export class Comunidad implements OnInit {
  private projectService = inject(ProjectService);
  private communityService = inject(CommunityService);

  projects: CommunityProject[] = [];
  currentPage = 1;
  limit = 12;

  isLoading = true;
  isLoadingMore = false;
  hasMore = true;

  searchQuery = '';
  searchTimeout: any;

  ngOnInit() {
    this.loadFeed(true);
  }

  loadFeed(reset = false) {
    if (reset) {
      this.currentPage = 1;
      this.isLoading = true;
      this.projects = [];
    } else {
      this.isLoadingMore = true;
    }

    this.projectService.getPublicFeed(this.currentPage, this.limit, this.searchQuery).subscribe({
      next: (response) => {
        const newProjects = response.data.docs as CommunityProject[];

        newProjects.forEach((p) => {
          if (p.likesCount === undefined) p.likesCount = 0;
          p.isLikedLocally = false;
        });

        if (reset) {
          this.projects = newProjects;
        } else {
          this.projects = [...this.projects, ...newProjects];
        }

        this.hasMore = response.data.hasNextPage ?? newProjects.length === this.limit;
        this.isLoading = false;
        this.isLoadingMore = false;
      },
      error: (err) => {
        console.error('Error cargando el feed', err);
        this.isLoading = false;
        this.isLoadingMore = false;
      },
    });
  }

  onSearchChange() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.loadFeed(true);
    }, 500);
  }

  loadMore() {
    if (this.hasMore && !this.isLoadingMore) {
      this.currentPage++;
      this.loadFeed();
    }
  }

  // Modificado para recibir el payload del evento
  handleLike(payload: { project: CommunityProject; event: Event }) {
    const { project, event } = payload;
    event.stopPropagation();
    event.preventDefault();

    project.isLikedLocally = true;
    project.likesCount = (project.likesCount || 0) + 1;

    this.communityService.likeProject(project._id).subscribe({
      next: (response) => {
        project.likesCount = response.data.likesCount;
      },
      error: () => {
        project.isLikedLocally = false;
        project.likesCount = (project.likesCount || 1) - 1;
      },
    });
  }
}
