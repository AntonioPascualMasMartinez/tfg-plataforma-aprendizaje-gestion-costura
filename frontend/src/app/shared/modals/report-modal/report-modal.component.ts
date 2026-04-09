/**
 * @file report-modal.component.ts
 * @description Componente modal interactivo para la generación de reportes de moderación.
 * Permite a los usuarios tipificar infracciones en el contenido (proyectos o comentarios)
 * y recolecta el Payload validado para su procesamiento por el contenedor padre.
 */
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
  /** Identificador unívoco del recurso a reportar. */
  @Input({ required: true }) targetId!: string;

  /** Categoría del recurso a reportar (Ej. 'Project', 'Comment'). */
  @Input({ required: true }) targetType!: ReportTargetType;

  /** Metadato descriptivo opcional para contextualizar la interfaz de usuario. */
  @Input() targetTitle?: string;

  /** Emisor de evento para la solicitud de destrucción del componente. */
  @Output() close = new EventEmitter<void>();

  /** Emisor de evento que transmite la carga útil estructuralmente válida. */
  @Output() submitted = new EventEmitter<CreateReportPayload>();

  /** Colección estática de causales de denuncia tipificadas. */
  predefinedReasons = [
    'Spam o contenido comercial',
    'Contenido inapropiado / Ofensivo',
    'Acoso o discurso de odio',
    'Infracción de propiedad intelectual (Patrones robados)',
  ];

  selectedReason: string | null = null;
  otherReason: string = '';
  isSubmitting = false;

  /** Evalúa si el usuario requiere introducir una justificación manual. */
  get isOtherSelected(): boolean {
    return this.selectedReason === 'Otro';
  }

  /**
   * Validación reactiva del formulario.
   * @returns {boolean} Autoriza el envío si los requisitos de información están satisfechos.
   */
  get canSubmit(): boolean {
    if (!this.selectedReason) return false;
    if (this.isOtherSelected && !this.otherReason.trim()) return false;
    return true;
  }

  /** Normaliza la justificación final componiendo la cadena en caso de motivos personalizados. */
  get finalReason(): string {
    if (this.isOtherSelected) {
      return `Otro: ${this.otherReason.trim()}`;
    }
    return this.selectedReason || '';
  }

  /**
   * Gestiona la selección de la tipología de reporte.
   * @param {string} reason - Causal predefinida seleccionada.
   */
  selectReason(reason: string): void {
    this.selectedReason = reason;
    if (reason !== 'Otro') {
      this.otherReason = '';
    }
  }

  /**
   * Ensambla el Payload y emite el evento de confirmación.
   */
  onSubmit(): void {
    if (!this.canSubmit) return;

    this.isSubmitting = true;

    const payload: CreateReportPayload = {
      targetType: this.targetType,
      targetId: this.targetId,
      reason: this.finalReason,
    };

    this.submitted.emit(payload);
    /* La delegación del cierre del componente recae sobre el contenedor padre 
       para mantener coherencia con la resolución de la petición HTTP. */
  }

  /**
   * Solicita el desmontaje del componente mitigando interrupciones de concurrencia.
   */
  closeModal(): void {
    if (this.isSubmitting) return;
    this.close.emit();
  }
}
