import { Component, OnInit, inject, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../shared/models/user.model';
import { Project, ProjectStatus } from '../../../shared/models/project.model';
import { CreateProjectModal } from '../../../shared/modals/create-project/create-project.modal';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink, CreateProjectModal],
  templateUrl: './inicio.html',
  styles: [
    `
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .hide-scrollbar {
        -ms-overflow-style: none; /* IE and Edge */
        scrollbar-width: none; /* Firefox */
      }
    `,
  ],
})
export class Inicio implements OnInit {
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  user: User | null = null;
  isLoadingUser = true;
  recentProject: Project | null = null;

  @ViewChild('carouselContainer') carouselContainer!: ElementRef;

  // Lista original de proyectos
  myProjects: Project[] = [];

  // Filtros y ordenación
  activeFilter: ProjectStatus | 'Todos' = 'Todos';
  sortBy: 'nuevo' | 'nombre' = 'nuevo';

  recommendedTutorial = {
    title: 'Dominando los patrones base',
    description:
      'Aprende a crear y modificar patrones fundamentales para cualquier prenda superior.',
    duration: '15 min',
    level: 'Intermedio',
  };

  isCreateModalOpen = false;

  ngOnInit() {
    this.loadUserData();
    this.mockProjects(); // Añadido temporalmente para que pruebes los filtros
  }

  // Getter dinámico que devuelve los proyectos filtrados y ordenados
  get filteredProjects(): Project[] {
    let filtered = this.myProjects;

    // 1. Filtrar por estado
    if (this.activeFilter !== 'Todos') {
      filtered = filtered.filter((p) => p.status === this.activeFilter);
    }

    // 2. Ordenar
    return [...filtered].sort((a, b) => {
      if (this.sortBy === 'nombre') {
        return a.title.localeCompare(b.title);
      } else {
        // 'nuevo' -> Fecha de creación descendente
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }

  // Método para contar proyectos por estado y mostrarlo en los botones
  countStatus(status: ProjectStatus | 'Todos'): number {
    if (status === 'Todos') return this.myProjects.length;
    return this.myProjects.filter((p) => p.status === status).length;
  }

  setFilter(filter: ProjectStatus | 'Todos') {
    this.activeFilter = filter;
  }

  setSort(event: Event) {
    this.sortBy = (event.target as HTMLSelectElement).value as 'nuevo' | 'nombre';
  }

  openCreateModal() {
    this.isCreateModalOpen = true;
  }

  handleProjectCreated(project: Project) {
    this.router.navigate(['/home/proyectos', project._id]);
  }

  private loadUserData() {
    this.isLoadingUser = true;
    this.userService.getMe().subscribe({
      next: (response) => {
        this.user = response.data;
        this.isLoadingUser = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingUser = false;
        this.cdr.detectChanges();
      },
    });
  }

  scrollLeft() {
    if (this.carouselContainer) {
      // 320px es aproximadamente el ancho de una tarjeta + el gap
      this.carouselContainer.nativeElement.scrollBy({ left: -320, behavior: 'smooth' });
    }
  }

  scrollRight() {
    if (this.carouselContainer) {
      this.carouselContainer.nativeElement.scrollBy({ left: 320, behavior: 'smooth' });
    }
  }

  // ----------------------------------------------------------------
  // TODO: Eliminar esto cuando conectes con tu servicio real
  private mockProjects() {
    this.myProjects = [
      {
        _id: '1',
        title: 'Camisa de Lino',
        status: 'Finalizado',
        createdAt: '2023-10-05T10:00:00Z',
      },
      {
        _id: '2',
        title: 'Pantalón Vaquero',
        status: 'En curso',
        createdAt: '2023-10-10T10:00:00Z',
      },
      {
        _id: '3',
        title: 'Chaqueta de Cuero',
        status: 'Planificado',
        createdAt: '2023-10-12T10:00:00Z',
      },
      { _id: '4', title: 'Falda Plisada', status: 'En curso', createdAt: '2023-10-15T10:00:00Z' },
    ] as Project[];
  }
}
