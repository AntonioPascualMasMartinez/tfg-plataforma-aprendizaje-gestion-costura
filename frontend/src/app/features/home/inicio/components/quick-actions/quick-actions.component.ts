/**
 * @file quick-actions.component.ts
 * @description Componente presentacional libre de estado (stateless) diseñado para
 * ofrecer accesos directos a las funcionalidades más recurrentes de la plataforma.
 * Actúa puramente como interfaz de usuario, delegando la ejecución de la lógica de negocio
 * al componente contenedor mediante la propagación de eventos.
 */
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  templateUrl: './quick-actions.component.html',
})
export class QuickActionsComponent {
  /** Emisor de evento para notificar la intención de iniciar un nuevo proyecto. */
  @Output() createClicked = new EventEmitter<void>();

  /** Emisor de evento para notificar la intención de compartir o publicar contenido. */
  @Output() shareClicked = new EventEmitter<void>();

  /**
   * Captura el evento de clic en la interfaz de creación y lo propaga hacia la jerarquía superior.
   */
  onCreateClick(): void {
    this.createClicked.emit();
  }

  /**
   * Captura el evento de clic en la interfaz de publicación y lo propaga hacia la jerarquía superior.
   */
  onShareClick(): void {
    this.shareClicked.emit();
  }
}
