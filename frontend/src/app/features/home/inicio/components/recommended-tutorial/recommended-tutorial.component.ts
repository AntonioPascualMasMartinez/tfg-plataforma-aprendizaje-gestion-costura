/**
 * @file recommended-tutorial.component.ts
 * @description Componente presentacional que encapsula la vista de una recomendación algorítmica.
 * Reutiliza el componente estándar de tarjeta de tutorial (`TutorialCardComponent`) adaptándolo
 * al contexto del panel de inicio. Gestiona estados de carga visual y la delegación de selección.
 */
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Tutorial } from '../../../../../shared/models/tutorial.model';
import { TutorialCardComponent } from '../../../../../shared/components/tutorial-card/tutorial-card';

@Component({
  selector: 'app-recommended-tutorial',
  standalone: true,
  imports: [TutorialCardComponent],
  templateUrl: './recommended-tutorial.component.html',
})
export class RecommendedTutorialComponent {
  /** Entidad del tutorial sugerido, provista por la lógica de negocio del componente padre. */
  @Input() tutorial: Tutorial | null = null;

  /** Indicador de estado para renderizar animaciones o esqueletos de carga (skeleton loaders). */
  @Input() isLoading = false;

  /** * Emisor de evento que transfiere la entidad seleccionada al contexto superior
   * para su resolución (e.g., apertura de ventana modal de detalles).
   */
  @Output() openTutorial = new EventEmitter<Tutorial>();

  /**
   * Captura la selección de la tarjeta hija y retransmite la entidad hacia el orquestador.
   * @param selectedTutorial Instancia del tutorial sobre el que se ha interactuado.
   */
  onOpenTutorial(selectedTutorial: Tutorial): void {
    this.openTutorial.emit(selectedTutorial);
  }
}
