import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project } from '../../models/project.model';
import { User } from '../../models/user.model';

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
  @Output() like = new EventEmitter<{ project: CommunityProject; event: Event }>();
  @Output() viewDetails = new EventEmitter<CommunityProject>();

  onCardClick() {
    this.viewDetails.emit(this.project);
  }

  onLikeClick(event: Event) {
    this.like.emit({ project: this.project, event });
  }

  getAuthorName(ownerId: string | Partial<User>): string {
    if (typeof ownerId === 'object' && ownerId !== null && 'displayName' in ownerId) {
      return ownerId.displayName || 'Costurero Anónimo';
    }
    return 'Costurero Anónimo';
  }

  getAuthorAvatar(ownerId: string | Partial<User>): string {
    // Si el usuario tiene avatar propio, lo mostramos
    if (typeof ownerId === 'object' && ownerId !== null && 'avatar' in ownerId && ownerId.avatar) {
      return ownerId.avatar;
    }

    // Si NO tiene avatar, generamos uno cálido con sus iniciales dinámicamente
    const name = this.getAuthorName(ownerId);
    // Usamos colores de nuestra paleta: fondo anaranjado muy suave (ffedd5) y texto primario (ea580c)
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ffedd5&color=ea580c&rounded=true&bold=true`;
  }
}
