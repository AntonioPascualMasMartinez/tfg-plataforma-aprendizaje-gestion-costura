import { Component, OnInit, inject, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { ProjectService } from '../../../core/services/project.service';
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
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `,
  ],
})
export class Inicio implements OnInit {
  private userService = inject(UserService);
  private projectService = inject(ProjectService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  user: User | null = null;
  isLoadingUser = true;
  isLoadingProjects = true;
  recentProject: Project | null = null;

  @ViewChild('carouselContainer') carouselContainer!: ElementRef;

  myProjects: Project[] = [];
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
    this.loadMyProjects();
  }

  get filteredProjects(): Project[] {
    let filtered = this.myProjects;

    if (this.activeFilter !== 'Todos') {
      filtered = filtered.filter((p) => p.status === this.activeFilter);
    }

    return [...filtered].sort((a, b) => {
      if (this.sortBy === 'nombre') {
        return a.title.localeCompare(b.title);
      } else {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }

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

  private loadMyProjects() {
    this.isLoadingProjects = true;
    this.projectService.getMyProjects(1, 20).subscribe({
      next: (response) => {
        this.myProjects = response.data.docs;

        if (this.myProjects.length > 0) {
          const inProgress = this.myProjects.filter((p) => p.status === 'En curso');
          this.recentProject = inProgress.length > 0 ? inProgress[0] : this.myProjects[0];
        } else {
          this.recentProject = null;
        }

        this.isLoadingProjects = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.myProjects = [];
        this.isLoadingProjects = false;
        this.cdr.detectChanges();
      },
    });
  }

  scrollLeft() {
    if (this.carouselContainer) {
      this.carouselContainer.nativeElement.scrollBy({ left: -320, behavior: 'smooth' });
    }
  }

  scrollRight() {
    if (this.carouselContainer) {
      this.carouselContainer.nativeElement.scrollBy({ left: 320, behavior: 'smooth' });
    }
  }
}
