import { Component, OnInit, inject, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { ProjectService } from '../../../core/services/project.service';
import { User } from '../../../shared/models/user.model';
import { Project, ProjectStatus } from '../../../shared/models/project.model';
import { CreateProjectModal } from '../../../shared/modals/create-project/create-project.modal';
import { TutorialService } from '../../../core/services/tutorial.service';
import { Tutorial } from '../../../shared/models/tutorial.model';

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
  private tutorialService = inject(TutorialService);
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

  recommendedTutorial: Tutorial | null = null;

  isCreateModalOpen = false;
  isLoadingTutorial = true;

  ngOnInit() {
    this.loadUserData();
    this.loadMyProjects();
    this.loadRandomTutorial();
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

  private loadRandomTutorial() {
    this.isLoadingTutorial = true;
    // Pedimos la primera página con un límite generoso para tener variedad
    this.tutorialService.getCatalog(1, 20).subscribe({
      next: (response) => {
        const tutorials = response.data.docs;
        if (tutorials && tutorials.length > 0) {
          // Elegimos un índice aleatorio del array devuelto
          const randomIndex = Math.floor(Math.random() * tutorials.length);
          this.recommendedTutorial = tutorials[randomIndex];
        } else {
          this.recommendedTutorial = null;
        }
        this.isLoadingTutorial = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.recommendedTutorial = null;
        this.isLoadingTutorial = false;
        this.cdr.detectChanges();
      },
    });
  }

  // Utilidad para formatear los minutos (ej: 90 -> "1h 30m")
  formatTime(minutes: number): string {
    if (!minutes) return '0 min';
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
}
