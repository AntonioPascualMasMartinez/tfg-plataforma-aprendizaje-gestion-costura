import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreateReportPayload, ReportTargetType } from '../../models/community.model';

@Component({
  selector: 'app-report-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report-modal.component.html',
})
export class ReportModalComponent {
  // Datos del objetivo obligatorios
  @Input({ required: true }) targetId!: string;
  @Input({ required: true }) targetType!: ReportTargetType;
  @Input() targetTitle?: string; // Opcional, para mostrar "Reportar 'Nombre del Proyecto'"

  @Output() close = new EventEmitter<void>();
  // Emitimos el payload final listo para el servicio
  @Output() submitted = new EventEmitter<CreateReportPayload>();

  // Motivos predefinidos frecuentes
  predefinedReasons = [
    'Spam o contenido comercial',
    'Contenido inapropiado / Ofensivo',
    'Acoso o discurso de odio',
    'Infracción de propiedad intelectual (Patrones robados)',
  ];

  selectedReason: string | null = null;
  otherReason: string = '';
  isSubmitting = false;

  get isOtherSelected(): boolean {
    return this.selectedReason === 'Otro';
  }

  get canSubmit(): boolean {
    if (!this.selectedReason) return false;
    if (this.isOtherSelected && !this.otherReason.trim()) return false;
    return true;
  }

  get finalReason(): string {
    if (this.isOtherSelected) {
      return `Otro: ${this.otherReason.trim()}`;
    }
    return this.selectedReason || '';
  }

  selectReason(reason: string) {
    this.selectedReason = reason;
    if (reason !== 'Otro') {
      this.otherReason = ''; // Limpiamos el campo "Otro" si selecciona una predefinida
    }
  }

  onSubmit() {
    if (!this.canSubmit) return;

    this.isSubmitting = true;

    const payload: CreateReportPayload = {
      targetType: this.targetType,
      targetId: this.targetId,
      reason: this.finalReason,
    };

    this.submitted.emit(payload);
    // Nota: No cerramos el modal aquí, dejamos que el padre decida tras el éxito/error de la API
  }

  closeModal() {
    if (this.isSubmitting) return; // Evitar cerrar mientras se envía
    this.close.emit();
  }
}