/**
 * @file mobile-header.component.ts
 * @description Componente presentacional diseñado específicamente para la interfaz móvil.
 * Proporciona acceso rápido a acciones globales encapsulando la lógica de navegación
 * y delegando la ejecución al componente contenedor superior mediante eventos.
 */
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-mobile-header',
  standalone: true,
  templateUrl: './mobile-header.component.html',
})
export class MobileHeaderComponent {
  /** Emisor de evento para notificar la intención de instanciar un nuevo proyecto */
  @Output() openCreate = new EventEmitter<void>();

  /**
   * Captura la interacción del usuario en la vista y propaga el evento hacia la jerarquía superior.
   */
  onOpenCreate(): void {
    this.openCreate.emit();
  }
}
