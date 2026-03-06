import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [NgClass],
  templateUrl: './confirm-modal.component.html',
})
export class ConfirmModalComponent {
  @Input() isOpen: boolean = false;
  @Input() title: string = 'Confirmar acción';
  @Input() message: string = '¿Estás seguro de que deseas realizar esta acción?';
  @Input() confirmText: string = 'Confirmar';
  @Input() cancelText: string = 'Cancelar';
  @Input() isDestructive: boolean = true; // Si es true, usa botón rojo (danger), si no, botón primario
  @Input() isLoading: boolean = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm() {
    if (!this.isLoading) {
      this.confirm.emit();
    }
  }

  onCancel() {
    if (!this.isLoading) {
      this.cancel.emit();
    }
  }
}
