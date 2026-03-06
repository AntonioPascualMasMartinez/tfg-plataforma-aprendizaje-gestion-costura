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
  toastService = inject(ToastService);

  // Asignamos colores de Tailwind en base al tipo (basado en tu styles.css)
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
