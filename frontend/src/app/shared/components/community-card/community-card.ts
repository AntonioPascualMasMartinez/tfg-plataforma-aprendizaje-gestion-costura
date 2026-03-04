import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-community-card',
  standalone: true,
  templateUrl: './community-card.html',
})
export class CommunityCard {
  @Input({ required: true }) imageUrl!: string;
  @Input({ required: true }) authorInitials!: string;
  @Input({ required: true }) authorName!: string;
  @Input({ required: true }) likes!: number;
}
