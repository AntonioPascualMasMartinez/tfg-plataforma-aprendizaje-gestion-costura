import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core'; // Añadido OnDestroy
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router'; // Añadido Router
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { merge, Subscription } from 'rxjs'; // Añadida Subscription

import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../shared/models/project.model';
import { ProjectCardComponent } from '../../../shared/components/project-card/project-card';
import { CreateProjectModal } from '../../../shared/modals/create-project/create-project.modal'; // Añadido el Modal
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-proyectos',
  standalone: true,
  // IMPORTANTE: Añadir CreateProjectModal a los imports
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
  // Implementar OnDestroy
  private projectService = inject(ProjectService);
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);
  private router = inject(Router);

  projects: Project[] = [];
  isLoading = true;

  // Controles
  searchTerm = new FormControl('');
  statusFilter = new FormControl('Todos');
  difficultyFilter = new FormControl('Todas');
  sortByFilter = new FormControl('nuevo');

  currentPage = 1;
  totalPages = 1;
  totalResults = 0;

  // NUEVO: Variables para controlar el modal y fugas de memoria
  isCreateModalOpen = false;
  private filterSubscription?: Subscription;

  ngOnInit() {
    this.loadProjects();
    this.setupFilters();
  }

  // NUEVO: Destruir la suscripción al salir de la vista (SOLUCIONA EL BUG)
  ngOnDestroy() {
    if (this.filterSubscription) {
      this.filterSubscription.unsubscribe();
    }
  }

  // NUEVO: Lógica del Modal
  openCreateModal() {
    this.isCreateModalOpen = true;
  }

  handleProjectCreated(project: Project) {
    this.isCreateModalOpen = false;
    // Redirigir al proyecto recién creado (igual que hace la vista inicio)
    this.router.navigate(['/home/proyectos', project._id]);
  }

  private setupFilters() {
    const search$ = this.searchTerm.valueChanges.pipe(debounceTime(400), distinctUntilChanged());
    const status$ = this.statusFilter.valueChanges;
    const difficulty$ = this.difficultyFilter.valueChanges;
    const sort$ = this.sortByFilter.valueChanges;

    // Guardamos la suscripción para poder limpiarla en ngOnDestroy
    this.filterSubscription = merge(search$, status$, difficulty$, sort$).subscribe(() => {
      this.currentPage = 1;
      this.loadProjects();
    });
  }

  loadProjects() {
    this.isLoading = true;
    this.cdr.markForCheck(); // Cambiado a markForCheck() (SOLUCIONA EL BUG)

    const search = this.searchTerm.value || '';
    const status = this.statusFilter.value || 'Todos';
    const sortBy = this.sortByFilter.value || 'nuevo';
    const difficulty = this.difficultyFilter.value || 'Todas';

    this.projectService.getMyProjects(this.currentPage, 9, status, sortBy, search).subscribe({
      next: (response) => {
        if (response.data) {
          let fetchedDocs = response.data.docs;
          if (difficulty !== 'Todas') {
            fetchedDocs = fetchedDocs.filter((p) => p.difficulty === difficulty);
          }

          this.projects = fetchedDocs;
          this.totalPages = response.data.totalPages;
          this.totalResults = response.data.totalDocs;
        } else {
          this.projects = [];
        }

        this.isLoading = false;
        this.cdr.markForCheck(); // Cambiado a markForCheck()
      },
      error: (err) => {
        console.error('Error cargando proyectos:', err);
        this.projects = [];
        this.isLoading = false;
        this.cdr.markForCheck(); // Cambiado a markForCheck()
      },
    });
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

  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.currentPage = newPage;
      this.loadProjects();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
