/**
 * @file recent-project.component.ts
 * @description Componente presentacional encargado de renderizar la tarjeta de reanudación rápida.
 * Muestra el último proyecto en el que el usuario ha interactuado. Si no existe un historial previo,
 * proporciona una ruta alternativa (Call to Action) para la creación de la primera entidad.
 */
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project } from '../../../../../shared/models/project.model';

@Component({
  selector: 'app-recent-project',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './recent-project.component.html',
})
export class RecentProjectComponent {
  /** * Entidad de datos inyectada desde el componente orquestador.
   * Se asume inmutable dentro de este contexto.
   */
  @Input() project: Project | null = null;

  /** * Emisor de evento para derivar la acción de creación cuando el usuario no posee proyectos previos.
   */
  @Output() createClicked = new EventEmitter<void>();

  /**
   * Propaga el evento de instanciación hacia el contenedor padre.
   */
  onCreateClick(): void {
    this.createClicked.emit();
  }
}
