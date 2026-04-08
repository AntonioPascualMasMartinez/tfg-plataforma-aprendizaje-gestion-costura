import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { merge, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { TutorialCardComponent } from '../../../shared/components/tutorial-card/tutorial-card';
import { TutorialService } from '../../../core/services/tutorial.service';
import { Tutorial, DifficultyLevel } from '../../../shared/models/tutorial.model';
import { TutorialDetailModalComponent } from '../../../shared/modals/tutorial-detail-modal/tutorial-detail-modal.component';

@Component({
  selector: 'app-tutoriales',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TutorialCardComponent, TutorialDetailModalComponent],
  templateUrl: './tutoriales.html',
})
export class Tutoriales implements OnInit, OnDestroy {
  private tutorialService = inject(TutorialService);
  private cdr = inject(ChangeDetectorRef);

  // --- ESTADOS ---
  featuredTutorial: Tutorial | null = null;
  gridTutorials: Tutorial[] = [];

  isLoading = true;
  errorMessage = '';

  currentPage = 1;
  totalPages = 1;
  limit = 10; // Si hay destacado, 1 para él y 9 para el grid. Si hay filtros, los 10 van al grid.

  selectedTutorial: Tutorial | null = null;
  showDetailModal = false;

  // --- FILTROS INTERACTIVOS ---
  searchTerm = new FormControl(''); // <-- NUEVO: Buscador de texto
  categoryFilter = new FormControl('Todos');
  difficultyFilter = new FormControl('Todos');
  timeFilter = new FormControl('Todos');

  // Opciones de filtros
  readonly categories = ['Todos', 'Bolsos', 'Monederos', 'Carteras'];
  readonly difficulties: ('Todos' | DifficultyLevel)[] = [
    'Todos',
    'Principiante',
    'Intermedio',
    'Avanzado',
  ];
  readonly times = ['Todos', 'Menos de 30 min', '30 a 60 min', 'Más de 1 hora'];

  private filterSubscription?: Subscription;

  ngOnInit() {
    this.loadTutorials();
    this.setupFilters();
  }

  ngOnDestroy() {
    if (this.filterSubscription) {
      this.filterSubscription.unsubscribe();
    }
  }

  private setupFilters() {
    // Configuramos RxJS para que reaccione a cualquier cambio en los filtros
    const search$ = this.searchTerm.valueChanges.pipe(debounceTime(400), distinctUntilChanged());
    const cat$ = this.categoryFilter.valueChanges;
    const diff$ = this.difficultyFilter.valueChanges;
    const time$ = this.timeFilter.valueChanges;

    this.filterSubscription = merge(search$, cat$, diff$, time$).subscribe(() => {
      this.currentPage = 1; // Al filtrar, siempre volvemos a la página 1
      this.loadTutorials();
    });
  }

  loadTutorials() {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    // 1. Preparamos los parámetros exactos para el Backend
    const search = this.searchTerm.value || '';
    const category = this.categoryFilter.value === 'Todos' ? undefined : this.categoryFilter.value!;
    const difficulty =
      this.difficultyFilter.value === 'Todos' ? undefined : this.difficultyFilter.value!;

    // Mapeo del filtro de texto a minutos reales
    let maxTime: number | undefined = undefined;
    let minTime: number | undefined = undefined;

    if (this.timeFilter.value === 'Menos de 30 min') maxTime = 30;
    if (this.timeFilter.value === '30 a 60 min') {
      maxTime = 60;
      minTime = 30;
    }
    if (this.timeFilter.value === 'Más de 1 hora') minTime = 60;

    // Llamada al servicio pasando la carga al backend
    this.tutorialService
      .getCatalog(this.currentPage, this.limit, category, difficulty, maxTime)
      .subscribe({
        next: (response) => {
          if (response.data) {
            let fetchedDocs = response.data.docs;

            // *Nota: Fallback local temporal para `search` y `minTime` hasta que actualicemos tu Backend
            if (search) {
              const query = search.toLowerCase();
              fetchedDocs = fetchedDocs.filter(
                (t: Tutorial) =>
                  t.title.toLowerCase().includes(query) ||
                  t.description.toLowerCase().includes(query),
              );
            }
            if (minTime) {
              fetchedDocs = fetchedDocs.filter((t: Tutorial) => (t.estimatedTime || 0) >= minTime!);
            }

            this.totalPages = response.data.totalPages;
            this.currentPage = response.data.page;

            // 2. Lógica del "Destacado Inteligente"
            const isFiltering =
              search !== '' ||
              category !== undefined ||
              difficulty !== undefined ||
              maxTime !== undefined ||
              minTime !== undefined;

            // Solo mostramos el destacado si estamos en la página 1 y NO hay ningún filtro activo
            if (this.currentPage === 1 && !isFiltering && fetchedDocs.length > 0) {
              this.featuredTutorial = fetchedDocs[0];
              this.gridTutorials = fetchedDocs.slice(1);
            } else {
              // Si el usuario está buscando algo, ocultamos el gigante y mostramos todo en el grid
              this.featuredTutorial = null;
              this.gridTutorials = fetchedDocs;
            }
          } else {
            this.featuredTutorial = null;
            this.gridTutorials = [];
          }

          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error cargando el catálogo:', err);
          this.errorMessage = 'No se pudieron cargar los tutoriales. Por favor, intenta de nuevo.';
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  setCategory(cat: string) {
    this.categoryFilter.setValue(cat);
  }

  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.currentPage = newPage;
      this.loadTutorials();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  openTutorialModal(tutorial: Tutorial) {
    this.selectedTutorial = tutorial;
    this.showDetailModal = true;
  }

  closeTutorialModal() {
    this.showDetailModal = false;
    setTimeout(() => {
      this.selectedTutorial = null;
    }, 300);
  }

  getTutorialCover(tutorial: Tutorial): string | null {
    if (!tutorial.steps || tutorial.steps.length === 0) return null;
    const lastStepWithMedia = [...tutorial.steps].reverse().find((s) => s.mediaUrl);
    return lastStepWithMedia ? lastStepWithMedia.mediaUrl : null;
  }
}
