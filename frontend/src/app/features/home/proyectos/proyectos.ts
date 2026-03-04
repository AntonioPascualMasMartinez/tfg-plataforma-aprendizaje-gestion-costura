import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';

import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../shared/models/project.model';

@Component({
  selector: 'app-proyectos',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './proyectos.html',
})
export class Proyectos implements OnInit {
  private projectService = inject(ProjectService);

  // Estado
  projects: Project[] = [];
  isLoading = true;
  searchTerm = new FormControl('');

  // Paginación simple
  currentPage = 1;
  totalPages = 1;
  totalResults = 0;

  ngOnInit() {
    this.loadProjects();
    this.setupSearch();
  }

  private setupSearch() {
    this.searchTerm.valueChanges.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => {
      this.currentPage = 1;
      this.loadProjects();
    });
  }

  loadProjects() {
    this.isLoading = true;
    const search = this.searchTerm.value || '';

    this.projectService
      .getPublicFeed(this.currentPage, 9, search)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.projects = response.data.docs;
            this.totalPages = response.data.totalPages;
            this.totalResults = response.data.totalDocs;
          }
        },
        error: (err) => console.error('Error cargando proyectos:', err),
      });
  }

  deleteProject(id: string) {
    if (confirm('¿Estás seguro de que quieres eliminar este proyecto?')) {
      this.projectService.deleteProject(id).subscribe({
        next: () => this.loadProjects(),
        error: (err) => console.error('Error al eliminar:', err),
      });
    }
  }

  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.currentPage = newPage;
      this.loadProjects();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
