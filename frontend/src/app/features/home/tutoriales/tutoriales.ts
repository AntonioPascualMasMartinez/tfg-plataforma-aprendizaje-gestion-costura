/**
 * @file tutoriales.ts
 * @description Componente gestor del catálogo interactivo de tutoriales.
 * Implementa un sistema de exploración estructurado con filtrado multicriterio,
 * apoyándose en flujos reactivos (RxJS) para optimizar la carga de datos.
 * Incluye un motor de visualización adaptativa que jerarquiza el contenido (destacado vs. cuadrícula)
 * en función del estado de la búsqueda.
 */
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
  /* Inyección de dependencias para persistencia y renderizado optimizado */
  private tutorialService = inject(TutorialService);
  private cdr = inject(ChangeDetectorRef);

  /** Entidad principal resaltada en la vista (hero section) */
  featuredTutorial: Tutorial | null = null;
  /** Colección de tutoriales listados en formato de cuadrícula */
  gridTutorials: Tutorial[] = [];

  isLoading = true;
  errorMessage = '';

  /* Atributos de control de paginación posicional */
  currentPage = 1;
  totalPages = 1;
  limit = 10;

  /* Estado de visualización y datos del modal de detalles */
  selectedTutorial: Tutorial | null = null;
  showDetailModal = false;

  /* Form Controls para la captura reactiva de criterios de búsqueda */
  searchTerm = new FormControl('');
  categoryFilter = new FormControl('Todos');
  difficultyFilter = new FormControl('Todos');
  timeFilter = new FormControl('Todos');

  /* Constantes de dominio para la parametrización de la interfaz */
  readonly categories = ['Todos', 'Bolsos', 'Monederos', 'Carteras'];
  readonly difficulties: ('Todos' | DifficultyLevel)[] = [
    'Todos',
    'Principiante',
    'Intermedio',
    'Avanzado',
  ];
  readonly times = ['Todos', 'Menos de 30 min', '30 a 60 min', 'Más de 1 hora'];

  /** Suscripción de control para evitar fugas de memoria en la escucha de filtros */
  private filterSubscription?: Subscription;

  ngOnInit(): void {
    this.loadTutorials();
    this.setupFilters();
  }

  ngOnDestroy(): void {
    if (this.filterSubscription) {
      this.filterSubscription.unsubscribe();
    }
  }

  /**
   * Inicializa la composición de eventos reactivos sobre los campos de filtrado.
   * Implementa retardos (debounce) para mitigar ráfagas de peticiones HTTP durante la escritura.
   */
  private setupFilters(): void {
    const search$ = this.searchTerm.valueChanges.pipe(debounceTime(400), distinctUntilChanged());
    const cat$ = this.categoryFilter.valueChanges;
    const diff$ = this.difficultyFilter.valueChanges;
    const time$ = this.timeFilter.valueChanges;

    this.filterSubscription = merge(search$, cat$, diff$, time$).subscribe(() => {
      this.currentPage = 1;
      this.loadTutorials();
    });
  }

  /**
   * Sincroniza el estado del componente con el origen de datos.
   * Ejecuta procesamiento híbrido: filtrado base en el servidor y refinamiento
   * condicional (texto y rangos de tiempo) en el cliente.
   */
  loadTutorials(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    const search = this.searchTerm.value || '';
    const category = this.categoryFilter.value === 'Todos' ? undefined : this.categoryFilter.value!;
    const difficulty =
      this.difficultyFilter.value === 'Todos' ? undefined : this.difficultyFilter.value!;

    let maxTime: number | undefined = undefined;
    let minTime: number | undefined = undefined;

    /* Transformación heurística del filtro de tiempo a límites numéricos */
    if (this.timeFilter.value === 'Menos de 30 min') maxTime = 30;
    if (this.timeFilter.value === '30 a 60 min') {
      maxTime = 60;
      minTime = 30;
    }
    if (this.timeFilter.value === 'Más de 1 hora') minTime = 60;

    this.tutorialService
      .getCatalog(this.currentPage, this.limit, category, difficulty, maxTime)
      .subscribe({
        next: (response) => {
          if (response.data) {
            let fetchedDocs = response.data.docs;

            /* Procesamiento local en memoria para criterios no delegados al backend */
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

            /* * Jerarquización inteligente:
             * El modo de presentación varía según la existencia de filtros activos.
             */
            const isFiltering =
              search !== '' ||
              category !== undefined ||
              difficulty !== undefined ||
              maxTime !== undefined ||
              minTime !== undefined;

            if (this.currentPage === 1 && !isFiltering && fetchedDocs.length > 0) {
              this.featuredTutorial = fetchedDocs[0];
              this.gridTutorials = fetchedDocs.slice(1);
            } else {
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
          console.error('Anomalía en la recuperación del catálogo:', err);
          this.errorMessage = 'No se pudieron cargar los tutoriales. Por favor, intenta de nuevo.';
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * Facilita la asignación pragmática de la categoría desde la interfaz.
   * @param cat Identificador textual de la categoría.
   */
  setCategory(cat: string): void {
    this.categoryFilter.setValue(cat);
  }

  /**
   * Desplaza el marco de datos mediante paginación indexada.
   * @param newPage Índice de destino.
   */
  changePage(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.currentPage = newPage;
      this.loadTutorials();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  openTutorialModal(tutorial: Tutorial): void {
    this.selectedTutorial = tutorial;
    this.showDetailModal = true;
  }

  closeTutorialModal(): void {
    this.showDetailModal = false;
    setTimeout(() => {
      this.selectedTutorial = null;
    }, 300);
  }

  /**
   * Resuelve algorítmicamente la imagen de portada de un tutorial explorando
   * de forma inversa la secuencia de pasos hasta hallar un recurso multimedia válido.
   * @param tutorial Entidad del tutorial a evaluar.
   * @returns URL de la imagen resultante o nulo en su defecto.
   */
  getTutorialCover(tutorial: Tutorial): string | null {
    if (!tutorial.steps || tutorial.steps.length === 0) return null;
    const lastStepWithMedia = [...tutorial.steps].reverse().find((s) => s.mediaUrl);
    return lastStepWithMedia ? lastStepWithMedia.mediaUrl : null;
  }
}
