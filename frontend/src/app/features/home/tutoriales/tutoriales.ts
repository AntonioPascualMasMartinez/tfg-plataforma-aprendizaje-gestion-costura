import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TutorialCardComponent } from '../../../shared/components/tutorial-card/tutorial-card';
import { TutorialService } from '../../../core/services/tutorial.service';
import { Tutorial } from '../../../shared/models/tutorial.model';

@Component({
  selector: 'app-tutoriales',
  standalone: true,
  imports: [CommonModule, TutorialCardComponent],
  templateUrl: './tutoriales.html',
})
export class Tutoriales implements OnInit {
  private tutorialService = inject(TutorialService);
  private cdr = inject(ChangeDetectorRef); // <-- Inyectamos el detector de cambios para mayor fluidez

  tutorials: Tutorial[] = [];
  isLoading = true;
  errorMessage = '';

  // Configuración de paginación
  currentPage = 1;
  totalPages = 1;
  limit = 9; // Mostraremos 9 para encajar perfecto en el grid de 3 columnas (como proyectos)

  // Configuración de filtros
  readonly categories = ['Todos', 'Bolsos', 'Monederos', 'Ropa', 'Hogar', 'Accesorios'];
  activeCategory = 'Todos';

  ngOnInit() {
    this.loadTutorials();
  }

  loadTutorials() {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges(); // <-- Forzamos actualización visual inmediata

    const categoryFilter = this.activeCategory === 'Todos' ? undefined : this.activeCategory;

    this.tutorialService.getCatalog(this.currentPage, this.limit, categoryFilter).subscribe({
      next: (response) => {
        if (response.data) {
          this.tutorials = response.data.docs;
          this.totalPages = response.data.totalPages;
          this.currentPage = response.data.page;
        }
        this.isLoading = false;
        this.cdr.detectChanges(); // <-- Actualizamos el DOM al recibir datos
      },
      error: (err) => {
        console.error('Error cargando el catálogo de tutoriales:', err);
        this.errorMessage = 'No se pudieron cargar los tutoriales. Por favor, intenta de nuevo.';
        this.isLoading = false;
        this.cdr.detectChanges(); // <-- Actualizamos el DOM en caso de error
      },
    });
  }

  setCategory(category: string) {
    if (this.activeCategory !== category) {
      this.activeCategory = category;
      this.currentPage = 1;
      this.loadTutorials();
    }
  }

  // Misma función de paginación que en Proyectos, con scroll suave hacia arriba
  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.currentPage = newPage;
      this.loadTutorials();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
