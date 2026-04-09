/**
 * @file inicio.ts
 * @description Componente contenedor (Smart Component) del panel principal (Dashboard) del usuario.
 * Actúa como orquestador de datos, recuperando el estado global de la sesión, los proyectos recientes
 * y las recomendaciones del catálogo. Delega la renderización visual a sus componentes hijos
 * y centraliza la gestión de ventanas modales y eventos de la interfaz.
 */
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

import { UserService } from '../../../core/services/user.service';
import { ProjectService } from '../../../core/services/project.service';
import { TutorialService } from '../../../core/services/tutorial.service';
import { User } from '../../../shared/models/user.model';
import { Project } from '../../../shared/models/project.model';
import { Tutorial } from '../../../shared/models/tutorial.model';

import { CreateProjectModal } from '../../../shared/modals/create-project/create-project.modal';
import { TutorialDetailModalComponent } from '../../../shared/modals/tutorial-detail-modal/tutorial-detail-modal.component';
import { PublishProjectModal } from '../../../shared/modals/publish-project/publish-project.modal';

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
    PublishProjectModal,
    MobileHeaderComponent,
    RecentProjectComponent,
    QuickActionsComponent,
    ProjectCollectionComponent,
    RecommendedTutorialComponent,
  ],
  templateUrl: './inicio.html',
})
export class Inicio implements OnInit {
  /* Inyección de dependencias mediante el paradigma funcional de Angular */
  private userService = inject(UserService);
  private projectService = inject(ProjectService);
  private tutorialService = inject(TutorialService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  /* --- ESTADO DE LA APLICACIÓN --- */

  /** Entidad del usuario autenticado */
  user: User | null = null;
  /** Referencia al proyecto con actividad más reciente para reanudación rápida */
  recentProject: Project | null = null;
  /** Colección completa de proyectos asociados al usuario */
  myProjects: Project[] = [];
  /** Entidad de tutorial sugerido algorítmicamente */
  recommendedTutorial: Tutorial | null = null;
  /** Referencia al tutorial seleccionado para visualización en ventana modal */
  selectedTutorial: Tutorial | null = null;

  /* --- INDICADORES DE CARGA ASÍNCRONA --- */
  isLoadingUser = true;
  isLoadingProjects = true;
  isLoadingTutorial = true;

  /* --- CONTROLADORES DE ESTADO PARA COMPONENTES FLOTANTES (MODALES) --- */
  isCreateModalOpen = false;
  isTutorialModalOpen = false;
  isPublishModalOpen = false;

  /**
   * Inicializa el ciclo de vida del componente desencadenando las peticiones
   * concurrentes para hidratar el panel principal.
   */
  ngOnInit(): void {
    this.loadUserData();
    this.loadMyProjects();
    this.loadRandomTutorial();
  }

  /* ==========================================================================
     MÉTODOS DE RECUPERACIÓN DE DATOS (Interacción con Servicios)
     ========================================================================== */

  private loadUserData(): void {
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

  /**
   * Recupera el repositorio de proyectos del usuario y determina algorítmicamente
   * el proyecto más relevante (priorizando aquellos en estado 'En curso').
   */
  private loadMyProjects(): void {
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

  /**
   * Solicita el catálogo de tutoriales y realiza una selección pseudoaleatoria
   * en el cliente para diversificar las recomendaciones mostradas en el panel.
   */
  private loadRandomTutorial(): void {
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

  /* ==========================================================================
     MANEJO DE EVENTOS EMITIDOS POR COMPONENTES HIJOS
     ========================================================================== */

  openCreateModal(): void {
    this.isCreateModalOpen = true;
  }

  /**
   * Intercepta la confirmación de creación de un nuevo proyecto, cierra el modal
   * y enruta al usuario al flujo de edición detallada del mismo.
   */
  handleProjectCreated(project: Project): void {
    this.isCreateModalOpen = false;
    this.router.navigate(['/home/proyectos', project._id, 'edit']);
  }

  /**
   * Actualiza el estado visual tras la publicación de un proyecto, forzando
   * la recarga del repositorio local para reflejar el cambio de estado.
   */
  handleProjectPublished(project: Project): void {
    this.isPublishModalOpen = false;
    this.loadMyProjects();
  }

  openTutorialModal(tutorial: Tutorial): void {
    this.selectedTutorial = tutorial;
    this.isTutorialModalOpen = true;
  }

  openPublishModal(): void {
    this.isPublishModalOpen = true;
  }

  closeTutorialModal(): void {
    this.isTutorialModalOpen = false;
    setTimeout(() => {
      this.selectedTutorial = null;
    }, 300);
  }
}
