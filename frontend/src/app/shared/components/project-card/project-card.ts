import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project } from '../../models/project.model';
import { DatePipe } from '@angular/common'; // Para formatear la fecha

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './project-card.html',
})
export class ProjectCardComponent {
  // Recibimos el proyecto desde el componente padre
  @Input({ required: true }) project!: Project;

  // Emitimos un evento cuando el usuario quiera borrar el proyecto
  @Output() delete = new EventEmitter<string>();

  // Método para obtener la imagen de portada (busca en los pasos)
  get coverImage(): string | null {
    if (this.project.steps && this.project.steps.length > 0) {
      const stepWithImage = this.project.steps.find((step) => step.mediaUrl);
      return stepWithImage ? stepWithImage.mediaUrl : null;
    }
    return null;
  }

  onDelete(event: Event) {
    // Evitamos que el click en borrar dispare la navegación de la tarjeta
    event.preventDefault();
    event.stopPropagation();
    this.delete.emit(this.project._id);
  }
}
