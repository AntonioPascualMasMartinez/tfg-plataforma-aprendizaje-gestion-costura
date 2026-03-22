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
  @Input() projects: Project[] = [];
  @Input() isLoading = false;

  @ViewChild('carouselContainer') carouselContainer!: ElementRef;

  activeFilter: ProjectStatus | 'Todos' = 'Todos';
  sortBy: 'nuevo' | 'nombre' = 'nuevo';

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

  countStatus(status: ProjectStatus | 'Todos'): number {
    if (status === 'Todos') return this.projects.length;
    return this.projects.filter((p) => p.status === status).length;
  }

  setFilter(filter: ProjectStatus | 'Todos') {
    this.activeFilter = filter;
  }

  setSort(event: Event) {
    this.sortBy = (event.target as HTMLSelectElement).value as 'nuevo' | 'nombre';
  }

  scrollLeft() {
    if (this.carouselContainer) {
      this.carouselContainer.nativeElement.scrollBy({ left: -320, behavior: 'smooth' });
    }
  }

  scrollRight() {
    if (this.carouselContainer) {
      this.carouselContainer.nativeElement.scrollBy({ left: 320, behavior: 'smooth' });
    }
  }
}
