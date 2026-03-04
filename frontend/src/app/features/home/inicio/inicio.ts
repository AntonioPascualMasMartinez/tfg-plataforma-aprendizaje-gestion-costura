import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core'; // <-- Importar ChangeDetectorRef
import { RouterLink } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../shared/models/user.model';
import { Project } from '../../../shared/models/project.model';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './inicio.html',
})
export class Inicio implements OnInit {
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef); // <-- Inyectar ChangeDetectorRef

  user: User | null = null;
  isLoadingUser = true;

  recentProject: Project | null = null;
  myProjects: Project[] = [];

  ngOnInit() {
    this.loadUserData();
  }

  private loadUserData() {
    this.isLoadingUser = true;
    this.userService.getMe().subscribe({
      next: (response) => {
        console.log('Datos del usuario cargados:', response.data);
        this.user = response.data;
        this.isLoadingUser = false; // <-- Lo movemos aquí

        this.cdr.detectChanges(); // <-- Forzamos a Angular a repintar el HTML
      },
      error: (err) => {
        console.error('Error cargando los datos del usuario', err);
        this.isLoadingUser = false; // <-- Lo movemos aquí también
        this.cdr.detectChanges();
      },
      // Eliminamos el bloque complete
    });
  }
}
