/**
 * @file toast.model.ts
 * @description Modelos de tipado estricto para el sistema de notificaciones de la interfaz gráfica.
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Estructura de datos temporal que representa un mensaje flotante reactivo.
 */
export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}
