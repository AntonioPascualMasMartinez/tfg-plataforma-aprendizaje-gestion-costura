import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project } from '../../models/project.model';
import { User } from '../../models/user.model';

// Extendemos Project para manejar el estado local en la vista (Dumb Component)
export interface CommunityProject extends Project {
  likesCount?: number;
  isLikedLocally?: boolean;
}

@Component({
  selector: 'app-community-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './community-card.component.html',
})
export class CommunityCardComponent {
  @Input({ required: true }) project!: CommunityProject;

  // Eventos de salida para que el componente padre (Feed) maneje la lógica con los servicios
  @Output() viewDetails = new EventEmitter<CommunityProject>();
  @Output() like = new EventEmitter<{ project: CommunityProject; event: Event }>();
  @Output() report = new EventEmitter<{ project: CommunityProject; event: Event }>();

  onCardClick() {
    this.viewDetails.emit(this.project);
  }

  onLikeClick(event: Event) {
    event.stopPropagation(); // Evita que al dar like se abra la tarjeta
    this.like.emit({ project: this.project, event });
  }

  onReportClick(event: Event) {
    event.stopPropagation(); // Evita que al reportar se abra la tarjeta
    this.report.emit({ project: this.project, event });
  }

  getAuthorName(ownerId: string | Partial<User>): string {
    // Verificamos el populate del backend
    if (typeof ownerId === 'object' && ownerId !== null && 'displayName' in ownerId) {
      return ownerId.displayName || 'Costurero Anónimo';
    }
    return 'Costurero Anónimo';
  }

  getAuthorAvatar(ownerId: string | Partial<User>): string {
    // Si el usuario tiene avatar propio tras el populate, lo mostramos
    if (typeof ownerId === 'object' && ownerId !== null && 'avatar' in ownerId && ownerId.avatar) {
      return ownerId.avatar;
    }

    // Si NO tiene avatar, generamos uno con sus iniciales dinámicamente
    const name = this.getAuthorName(ownerId);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ffedd5&color=ea580c&rounded=true&bold=true`;
  }
}
