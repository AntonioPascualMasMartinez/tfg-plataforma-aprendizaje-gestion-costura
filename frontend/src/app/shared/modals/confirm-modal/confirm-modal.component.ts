/**
 * @file confirm-modal.component.ts
 * @description Componente presentacional (Dumb Component) transversal para la confirmación de acciones críticas.
 * Actúa de manera agnóstica frente a la lógica de negocio, siendo altamente reutilizable mediante
 * la parametrización de sus propiedades de entrada y la emisión de eventos de resolución.
 */
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [NgClass],
  templateUrl: './confirm-modal.component.html',
})
export class ConfirmModalComponent {
  /** Determina el estado de montaje visual del componente. */
  @Input() isOpen: boolean = false;

  /** Encabezado textual del cuadro de diálogo. */
  @Input() title: string = 'Confirmar acción';

  /** Cuerpo descriptivo que alerta sobre la consecuencia de la acción. */
  @Input() message: string = '¿Estás seguro de que deseas realizar esta acción?';

  /** Leyenda del botón afirmativo. */
  @Input() confirmText: string = 'Confirmar';

  /** Leyenda del botón negativo/cierre. */
  @Input() cancelText: string = 'Cancelar';

  /** Modificador de diseño para operaciones destructivas (Ej. Borrado de registros). */
  @Input() isDestructive: boolean = true;

  /** Estado de bloqueo de interacción para espera de operaciones asíncronas. */
  @Input() isLoading: boolean = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  /** * Transmite la afirmación a la jerarquía superior si el estado no está bloqueado.
   */
  onConfirm(): void {
    if (!this.isLoading) {
      this.confirm.emit();
    }
  }

  /** * Revoca la operación y transmite la cancelación.
   */
  onCancel(): void {
    if (!this.isLoading) {
      this.cancel.emit();
    }
  }
}
