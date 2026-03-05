import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router'; // Añadido Router
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../shared/models/user.model';
import { Project } from '../../../shared/models/project.model';
import { CreateProjectModal } from '../../../shared/modals/create-project/create-project.modal'; // Importar modal

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink, CreateProjectModal], // Añadir a imports
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
