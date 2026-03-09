import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project } from '../../models/project.model';
import { User } from '../../models/user.model';

// Exportamos la interfaz desde aquí para que el padre la pueda usar
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
    if (typeof ownerId === 'object' && ownerId !== null && 'avatar' in ownerId && ownerId.avatar) {
      return ownerId.avatar;
    }
    return '/assets/default-avatar.png';
  }
}
