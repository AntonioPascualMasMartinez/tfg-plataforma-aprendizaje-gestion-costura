import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../shared/models/user.model';
import { Project } from '../../../shared/models/project.model';
import { CreateProjectModal } from '../../../shared/modals/create-project/create-project.modal';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink, CreateProjectModal],
  templateUrl: './inicio.html',
})
export class Inicio implements OnInit {
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  user: User | null = null;
  isLoadingUser = true;
  recentProject: Project | null = null;
  myProjects: Project[] = [];

  // Datos mockeados para el tutorial recomendado
  recommendedTutorial = {
    title: 'Dominando los patrones base',
    description:
      'Aprende a crear y modificar patrones fundamentales para cualquier prenda superior.',
    duration: '15 min',
    level: 'Intermedio',
  };

  // Estado del modal
  isCreateModalOpen = false;

  ngOnInit() {
    this.loadUserData();
  }

  // Métodos para el modal
  openCreateModal() {
    this.isCreateModalOpen = true;
  }

  handleProjectCreated(project: Project) {
    // Al crearse, redirigimos al detalle del nuevo proyecto
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
}
