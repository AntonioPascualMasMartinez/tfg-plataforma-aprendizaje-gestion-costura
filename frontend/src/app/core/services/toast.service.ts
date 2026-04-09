/**
 * @file toast.service.ts
 * @description Servicio de notificación en tiempo real (Toasts).
 * Gestiona el estado y ciclo de vida de los mensajes flotantes de la interfaz utilizando
 * Angular Signals, proveyendo un flujo de información no bloqueante para el usuario.
 */
import { Injectable, signal } from '@angular/core';
import { Toast, ToastType } from '../../shared/models/toast.model';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  /** * Almacén de estado reactivo (Signal) que contiene las notificaciones activas.
   */
  toasts = signal<Toast[]>([]);

  /**
   * Emite una nueva notificación en el sistema con un temporizador de autodestrucción.
   * @param {ToastType} type - Nivel de severidad de la notificación (success, error, etc.).
   * @param {string} message - Contenido descriptivo del mensaje.
   * @param {number} [duration=4000] - Tiempo de exposición en milisegundos.
   */
  show(type: ToastType, message: string, duration: number = 4000) {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, type, message, duration };

    this.toasts.update((currentToasts) => [...currentToasts, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  /* Métodos adaptadores (Wrappers) para la instanciación ágil según severidad */

  success(message: string, duration?: number) {
    this.show('success', message, duration);
  }

  error(message: string, duration?: number) {
    this.show('error', message, duration);
  }

  warning(message: string, duration?: number) {
    this.show('warning', message, duration);
  }

  info(message: string, duration?: number) {
    this.show('info', message, duration);
  }

  /**
   * Elimina manualmente una notificación activa del flujo reactivo.
   * @param {string} id - Identificador alfanumérico generado en la creación.
   */
  remove(id: string) {
    this.toasts.update((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  }
}
