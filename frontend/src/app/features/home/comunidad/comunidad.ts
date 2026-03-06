import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Necesario para ngModel en el buscador
import { ProjectService } from '../../../core/services/project.service';
import { CommunityService } from '../../../core/services/community.service';
import { Project } from '../../../shared/models/project.model';
import { User } from '../../../shared/models/user.model';

// Extendemos localmente la interfaz para manejar el estado visual del Like
interface CommunityProject extends Project {
  likesCount?: number;
  isLikedLocally?: boolean;
}

@Component({
  selector: 'app-comunidad',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './comunidad.html',
  styleUrl: './comunidad.scss',
})
export class Comunidad implements OnInit {
  private projectService = inject(ProjectService);
  private communityService = inject(CommunityService);

  projects: CommunityProject[] = [];
  currentPage = 1;
  limit = 12; // Un buen número para grids de 1, 2, 3 o 4 columnas

  isLoading = true;
  isLoadingMore = false;
  hasMore = true;

  searchQuery = '';
  searchTimeout: any;

  ngOnInit() {
    this.loadFeed(true);
  }

  loadFeed(reset = false) {
    if (reset) {
      this.currentPage = 1;
      this.isLoading = true;
      this.projects = [];
    } else {
      this.isLoadingMore = true;
    }

    this.projectService.getPublicFeed(this.currentPage, this.limit, this.searchQuery).subscribe({
      next: (response) => {
        const newProjects = response.data.docs as CommunityProject[];

        // Inicializamos valores visuales para evitar undefined
        newProjects.forEach((p) => {
          if (p.likesCount === undefined) p.likesCount = 0;
          p.isLikedLocally = false;
        });

        if (reset) {
          this.projects = newProjects;
        } else {
          this.projects = [...this.projects, ...newProjects];
        }

        // Asumiendo que tu PaginatedResult tiene estas propiedades (ajusta si es necesario)
        this.hasMore = response.data.hasNextPage ?? newProjects.length === this.limit;
        this.isLoading = false;
        this.isLoadingMore = false;
      },
      error: (err) => {
        console.error('Error cargando el feed público', err);
        this.isLoading = false;
        this.isLoadingMore = false;
      },
    });
  }

  // Búsqueda con debounce para no saturar la API en cada pulsación de tecla
  onSearchChange() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.loadFeed(true);
    }, 500);
  }

  loadMore() {
    if (this.hasMore && !this.isLoadingMore) {
      this.currentPage++;
      this.loadFeed();
    }
  }

  likeProject(project: CommunityProject, event: Event) {
    event.stopPropagation(); // Evita que se dispare la navegación de la tarjeta
    event.preventDefault();

    // Actualización optimista: cambiamos la UI antes de recibir la respuesta
    project.isLikedLocally = true;
    project.likesCount = (project.likesCount || 0) + 1;

    this.communityService.likeProject(project._id).subscribe({
      next: (response) => {
        // Sincronizamos con el dato real del servidor
        project.likesCount = response.data.likesCount;
      },
      error: () => {
        // Revertimos en caso de fallo
        project.isLikedLocally = false;
        project.likesCount = (project.likesCount || 1) - 1;
      },
    });
  }

  // Utilidad para extraer el nombre del autor cuando está poblado
  getAuthorName(ownerId: string | Partial<User>): string {
    if (typeof ownerId === 'object' && ownerId !== null && 'displayName' in ownerId) {
      return ownerId.displayName || 'Costurero Anónimo';
    }
    return 'Costurero Anónimo';
  }

  // Utilidad para extraer el avatar del autor
  getAuthorAvatar(ownerId: string | Partial<User>): string {
    if (typeof ownerId === 'object' && ownerId !== null && 'avatar' in ownerId && ownerId.avatar) {
      return ownerId.avatar;
    }
    return '/assets/default-avatar.png'; // Asegúrate de tener esta imagen o usa un placeholder
  }
}
