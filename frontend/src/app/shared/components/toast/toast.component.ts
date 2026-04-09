/**
 * @file toast.component.ts
 * @description Componente visual global para el sistema de notificaciones asíncronas.
 * Actúa en sincronía con el estado reactivo provisto por el ToastService.
 * Suscribe su estilo de presentación a los tokens semánticos definidos en el sistema de diseño (Tailwind).
 */
import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [NgClass],
  templateUrl: './toast.component.html',
})
export class ToastComponent {
  /** Servicio centralizado inyectado responsable del flujo de los mensajes. */
  toastService = inject(ToastService);

  /**
   * Resuelve dinámicamente las clases utilitarias de Tailwind CSS según el nivel de severidad.
   * @param {string} type - Clasificación de la notificación (success, error, warning, info).
   * @returns {string} Cadena de clases CSS aplicables.
   */
  getToastClasses(type: string): string {
    switch (type) {
      case 'success':
        return 'bg-success/10 border-success/20 text-success';
      case 'error':
        return 'bg-danger/10 border-danger/20 text-danger';
      case 'warning':
        return 'bg-warning/10 border-warning/20 text-warning';
      case 'info':
      default:
        return 'bg-info/10 border-info/20 text-info';
    }
  }
}
