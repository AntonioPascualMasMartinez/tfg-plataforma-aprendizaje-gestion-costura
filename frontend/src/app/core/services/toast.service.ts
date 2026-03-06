import { Injectable, signal } from '@angular/core';
import { Toast, ToastType } from '../../shared/models/toast.model';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  // Estado reactivo con Signals
  toasts = signal<Toast[]>([]);

  show(type: ToastType, message: string, duration: number = 4000) {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, type, message, duration };

    // Añadimos el nuevo toast al estado
    this.toasts.update((currentToasts) => [...currentToasts, newToast]);

    // Lo eliminamos automáticamente tras el tiempo especificado
    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  // Métodos de ayuda rápidos
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

  remove(id: string) {
    this.toasts.update((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  }
}
