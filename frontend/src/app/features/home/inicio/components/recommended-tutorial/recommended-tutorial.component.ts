import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Tutorial } from '../../../../../shared/models/tutorial.model';
import { TutorialCardComponent } from '../../../../../shared/components/tutorial-card/tutorial-card';

@Component({
  selector: 'app-recommended-tutorial',
  standalone: true,
  imports: [TutorialCardComponent], // Importamos la tarjeta reutilizable
  templateUrl: './recommended-tutorial.component.html',
})
export class RecommendedTutorialComponent {
  // Recibimos los datos del componente padre
  @Input() tutorial: Tutorial | null = null;
  @Input() isLoading = false;

  // Emitimos el tutorial seleccionado para que el padre abra el modal
  @Output() openTutorial = new EventEmitter<Tutorial>();

  onOpenTutorial(selectedTutorial: Tutorial) {
    this.openTutorial.emit(selectedTutorial);
  }
}
