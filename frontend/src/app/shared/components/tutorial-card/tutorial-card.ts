import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-tutorial-card',
  standalone: true,
  templateUrl: './tutorial-card.html',
})
export class TutorialCard {
  // Definimos los datos que recibirá el componente desde fuera
  @Input({ required: true }) imageUrl!: string;
  @Input({ required: true }) title!: string;
  @Input({ required: true }) description!: string;
}
