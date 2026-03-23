import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { merge, Subscription } from 'rxjs';

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

  // Estados
  featuredTutorial: Tutorial | null = null;
  gridTutorials: Tutorial[] = [];

  isLoading = true;
  errorMessage = '';

  currentPage = 1;
  totalPages = 1;
  limit = 10; // 1 Destacado + 9 Grid

  selectedTutorial: Tutorial | null = null;
  showDetailModal = false;

  // Filtros interactivos
  categoryFilter = new FormControl('Todos');
  difficultyFilter = new FormControl('Todos');
  timeFilter = new FormControl('Todos');

  // Arrays de opciones basados estrictamente en tutorial.model.ts
  readonly categories = ['Todos', 'Bolsos', 'Monederos', 'Ropa', 'Hogar', 'Accesorios'];
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
    const cat$ = this.categoryFilter.valueChanges;
    const diff$ = this.difficultyFilter.valueChanges;
    const time$ = this.timeFilter.valueChanges;

    this.filterSubscription = merge(cat$, diff$, time$).subscribe(() => {
      this.currentPage = 1;
      this.loadTutorials();
    });
  }

  loadTutorials() {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    const category = this.categoryFilter.value === 'Todos' ? undefined : this.categoryFilter.value!;

    this.tutorialService.getCatalog(this.currentPage, this.limit, category).subscribe({
      next: (response) => {
        if (response.data) {
          let fetchedDocs = response.data.docs;

          // Filtrado Local: Por difficultyLevel (según modelo)
          const diff = this.difficultyFilter.value;
          if (diff !== 'Todos') {
            fetchedDocs = fetchedDocs.filter((t: Tutorial) => t.difficultyLevel === diff);
          }

          // Filtrado Local: Por estimatedTime (según modelo)
          const time = this.timeFilter.value;
          if (time !== 'Todos') {
            fetchedDocs = fetchedDocs.filter((t: Tutorial) => {
              const dur = t.estimatedTime || 0;
              if (time === 'Menos de 30 min') return dur < 30;
              if (time === '30 a 60 min') return dur >= 30 && dur <= 60;
              if (time === 'Más de 1 hora') return dur > 60;
              return true;
            });
          }

          this.totalPages = response.data.totalPages;
          this.currentPage = response.data.page;

          // Separar Destacado vs Grid
          if (this.currentPage === 1 && fetchedDocs.length > 0) {
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

  /**
   * Obtiene dinámicamente la imagen de portada basada en el último paso del tutorial
   */
  getTutorialCover(tutorial: Tutorial): string | null {
    if (!tutorial.steps || tutorial.steps.length === 0) return null;
    
    // Invertimos el array para encontrar el último mediaUrl disponible
    const lastStepWithMedia = [...tutorial.steps].reverse().find(s => s.mediaUrl);
    return lastStepWithMedia ? lastStepWithMedia.mediaUrl : null;
  }
}
