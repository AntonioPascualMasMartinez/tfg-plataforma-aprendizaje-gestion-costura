/**
 * @file project-collection.component.ts
 * @description Componente de interfaz para la visualización y exploración de colecciones de proyectos.
 * Implementa un carrusel con desplazamiento horizontal controlado, junto con capacidades de
 * filtrado y ordenación en memoria (lado del cliente) manteniendo la inmutabilidad de los datos originales.
 */
import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project, ProjectStatus } from '../../../../../shared/models/project.model';

@Component({
  selector: 'app-project-collection',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './project-collection.component.html',
  styles: [
    `
      /* Ocultación de la barra de desplazamiento manteniendo la funcionalidad táctil */
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `,
  ],
})
export class ProjectCollectionComponent {
  /** Colección de datos inyectada desde el componente orquestador */
  @Input() projects: Project[] = [];
  /** Indicador de estado de resolución de los datos */
  @Input() isLoading = false;

  /** Referencia directa al contenedor DOM para la manipulación programática del scroll */
  @ViewChild('carouselContainer') carouselContainer!: ElementRef;

  /* Criterios de evaluación para el procesamiento local de la colección */
  activeFilter: ProjectStatus | 'Todos' = 'Todos';
  sortBy: 'nuevo' | 'nombre' = 'nuevo';

  /**
   * Propiedad computada (Getter) que evalúa dinámicamente la colección original
   * aplicando las directivas de filtrado y ordenamiento. Garantiza la inmutabilidad
   * del array base creando copias superficiales mediante el operador de propagación.
   */
  get filteredProjects(): Project[] {
    let filtered = this.projects;

    if (this.activeFilter !== 'Todos') {
      filtered = filtered.filter((p) => p.status === this.activeFilter);
    }

    return [...filtered].sort((a, b) => {
      if (this.sortBy === 'nombre') {
        return a.title.localeCompare(b.title);
      } else {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }

  /**
   * Calcula la volumetría de proyectos según su estado transaccional para la
   * actualización de contadores en los controles de interfaz.
   * @param status Estado a evaluar.
   * @returns Número de entidades coincidentes.
   */
  countStatus(status: ProjectStatus | 'Todos'): number {
    if (status === 'Todos') return this.projects.length;
    return this.projects.filter((p) => p.status === status).length;
  }

  /**
   * Modifica el criterio de filtrado reactivo del componente.
   * @param filter Nuevo estado objetivo para el filtro.
   */
  setFilter(filter: ProjectStatus | 'Todos'): void {
    this.activeFilter = filter;
  }

  /**
   * Captura y asigna la preferencia de ordenación del usuario desde un elemento select.
   * @param event Evento disparado por el control de formulario.
   */
  setSort(event: Event): void {
    this.sortBy = (event.target as HTMLSelectElement).value as 'nuevo' | 'nombre';
  }

  /* ==========================================================================
     MÉTODOS DE MANIPULACIÓN DEL MODELO DE OBJETOS DEL DOCUMENTO (DOM)
     ========================================================================== */

  /**
   * Ejecuta una transición de desplazamiento programático hacia la izquierda en el carrusel.
   */
  scrollLeft(): void {
    if (this.carouselContainer) {
      this.carouselContainer.nativeElement.scrollBy({ left: -320, behavior: 'smooth' });
    }
  }

  /**
   * Ejecuta una transición de desplazamiento programático hacia la derecha en el carrusel.
   */
  scrollRight(): void {
    if (this.carouselContainer) {
      this.carouselContainer.nativeElement.scrollBy({ left: 320, behavior: 'smooth' });
    }
  }
}
