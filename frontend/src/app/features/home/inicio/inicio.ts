import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

// Servicios y Modelos
import { UserService } from '../../../core/services/user.service';
import { ProjectService } from '../../../core/services/project.service';
import { TutorialService } from '../../../core/services/tutorial.service';
import { User } from '../../../shared/models/user.model';
import { Project } from '../../../shared/models/project.model';
import { Tutorial } from '../../../shared/models/tutorial.model';

// Modales
import { CreateProjectModal } from '../../../shared/modals/create-project/create-project.modal';
import { TutorialDetailModalComponent } from '../../../shared/modals/tutorial-detail-modal/tutorial-detail-modal.component';

// Nuevos Subcomponentes (Asumiendo que los crearás)
import { MobileHeaderComponent } from './components/mobile-header/mobile-header.component';
import { RecentProjectComponent } from './components/recent-project/recent-project.component';
import { QuickActionsComponent } from './components/quick-actions/quick-actions.component';
import { ProjectCollectionComponent } from './components/project-collection/project-collection.component';
import { RecommendedTutorialComponent } from './components/recommended-tutorial/recommended-tutorial.component';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [
    CreateProjectModal,
    TutorialDetailModalComponent,
    MobileHeaderComponent,
    RecentProjectComponent,
    QuickActionsComponent,
    ProjectCollectionComponent,
    RecommendedTutorialComponent,
  ],
  templateUrl: './inicio.html',
})
export class Inicio implements OnInit {
  private userService = inject(UserService);
  private projectService = inject(ProjectService);
  private tutorialService = inject(TutorialService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  // Estados
  user: User | null = null;
  recentProject: Project | null = null;
  myProjects: Project[] = [];
  recommendedTutorial: Tutorial | null = null;
  selectedTutorial: Tutorial | null = null;

  // Loaders
  isLoadingUser = true;
  isLoadingProjects = true;
  isLoadingTutorial = true;

  // Control de Modales
  isCreateModalOpen = false;
  isTutorialModalOpen = false;

  ngOnInit() {
    this.loadUserData();
    this.loadMyProjects();
    this.loadRandomTutorial();
  }

  // --- MÉTODOS DE DATOS ---
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

  private loadRandomTutorial() {
    this.isLoadingTutorial = true;
    this.tutorialService.getCatalog(1, 20).subscribe({
      next: (response) => {
        const tutorials = response.data.docs;
        if (tutorials && tutorials.length > 0) {
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

  // --- MANEJO DE EVENTOS DE COMPONENTES HIJOS ---
  openCreateModal() {
    this.isCreateModalOpen = true;
  }

  handleProjectCreated(project: Project) {
    this.isCreateModalOpen = false;
    this.router.navigate(['/home/proyectos', project._id]);
  }

  openTutorialModal(tutorial: Tutorial) {
    this.selectedTutorial = tutorial;
    this.isTutorialModalOpen = true;
  }

  closeTutorialModal() {
    this.isTutorialModalOpen = false;
    setTimeout(() => {
      this.selectedTutorial = null;
    }, 300);
  }
}
