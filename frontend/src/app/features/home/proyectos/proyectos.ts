import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../shared/models/project.model';
import { ProjectCardComponent } from '../../../shared/components/project-card/project-card';

@Component({
  selector: 'app-proyectos',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ProjectCardComponent],
  templateUrl: './proyectos.html',
})
export class Proyectos implements OnInit {
  private projectService = inject(ProjectService);
  private cdr = inject(ChangeDetectorRef);

  projects: Project[] = [];
  isLoading = true;
  searchTerm = new FormControl('');

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
    this.cdr.detectChanges();

    const search = this.searchTerm.value || '';

    // Cambiamos getPublicFeed por getMyProjects
    this.projectService.getMyProjects(this.currentPage, 9, 'Todos', 'nuevo', search).subscribe({
      next: (response) => {
        if (response.data) {
          this.projects = response.data.docs;
          this.totalPages = response.data.totalPages;
          this.totalResults = response.data.totalDocs;
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando proyectos:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  deleteProject(id: string) {
    if (confirm('¿Estás seguro de que quieres eliminar este proyecto?')) {
      this.projectService.deleteProject(id).subscribe({
        next: () => {
          // Si es el último elemento de la página y no es la primera, volvemos una atrás
          if (this.projects.length === 1 && this.currentPage > 1) {
            this.currentPage--;
          }
          this.loadProjects();
        },
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
