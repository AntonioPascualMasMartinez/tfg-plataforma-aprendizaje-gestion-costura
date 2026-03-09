import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ProjectService } from '../../../core/services/project.service';
import { CommunityService } from '../../../core/services/community.service';
import {
  CommunityCardComponent,
  CommunityProject,
} from '../../../shared/components/community-card/community-card.component';

@Component({
  selector: 'app-comunidad',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, CommunityCardComponent],
  templateUrl: './comunidad.html',
  styleUrl: './comunidad.scss',
})
export class Comunidad implements OnInit {
  private projectService = inject(ProjectService);
  private communityService = inject(CommunityService);
  private cdr = inject(ChangeDetectorRef);

  projects: CommunityProject[] = [];
  currentPage = 1;
  limit = 12;

  isLoading = true;
  isLoadingMore = false;
  hasMore = true;

  searchTerm = new FormControl('');

  ngOnInit() {
    this.setupSearch();
    this.loadFeed(true);
  }

  private setupSearch() {
    this.searchTerm.valueChanges.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => {
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

    project.isLikedLocally = true;
    project.likesCount = (project.likesCount || 0) + 1;

    this.communityService.likeProject(project._id).subscribe({
      next: (response) => {
        project.likesCount = response.data.likesCount;
        this.cdr.detectChanges();
      },
      error: () => {
        project.isLikedLocally = false;
        project.likesCount = (project.likesCount || 1) - 1;
        this.cdr.detectChanges();
      },
    });
  }
}
