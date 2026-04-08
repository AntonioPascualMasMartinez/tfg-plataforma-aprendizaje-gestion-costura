import {
  Component,
  inject,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  OnDestroy,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, merge } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { TutorialService } from '../../../core/services/tutorial.service';
import { Tutorial, CreateTutorialPayload } from '../../../shared/models/tutorial.model';
import { CreateTutorialModalComponent } from '../../../shared/modals/create-tutorial-modal/create-tutorial-modal.component';
import { ConfirmModalComponent } from '../../../shared/modals/confirm-modal/confirm-modal.component';

// Interfaz para el modal de confirmación (Borrado)
interface DeleteModalState {
  isOpen: boolean;
  isLoading: boolean;
  tutorialId: string | null;
  tutorialTitle: string;
}

@Component({
  selector: 'app-admin-tutorials',
  standalone: true,
  imports: [DatePipe, CreateTutorialModalComponent, ConfirmModalComponent, ReactiveFormsModule],
  templateUrl: './tutorials.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush, // Optimización de rendimiento
})
export class TutorialsComponent implements OnInit, OnDestroy {
  private tutorialService = inject(TutorialService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  tutorials: Tutorial[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // --- Filtros Reactivos ---
  searchControl = new FormControl(''); // Servirá para Título o Categoría (búsqueda local por ahora)
  difficultyControl = new FormControl(''); // Filtro enviado al backend
  searchTerm = '';

  // --- Paginación ---
  currentPage = 1;
  limit = 10;
  totalPages = 1;
  totalDocs = 0;

  // --- Ordenación ---
  sortColumn: keyof Tutorial | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // --- Estado Modal Creación/Edición ---
  isCreateModalOpen = false;
  isSavingTutorial = false;
  selectedTutorialForEdit: Tutorial | null = null; // Si es null, es Creación; si tiene valor, es Edición

  // --- Estado Modal Confirmación de Borrado ---
  deleteModal: DeleteModalState = {
    isOpen: false,
    isLoading: false,
    tutorialId: null,
    tutorialTitle: '',
  };

  ngOnInit() {
    this.setupFilters();
    this.loadTutorials();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFilters() {
    // Escuchar cambios tanto en la barra de búsqueda como en el selector de dificultad
    merge(this.searchControl.valueChanges, this.difficultyControl.valueChanges)
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.searchTerm = this.searchControl.value?.toLowerCase() || '';
        this.currentPage = 1; // Volver a página 1 al filtrar
        this.loadTutorials();
      });
  }

  loadTutorials() {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();

    const difficulty = this.difficultyControl.value || undefined;

    this.tutorialService.getCatalog(this.currentPage, this.limit, undefined, difficulty).subscribe({
      next: (response) => {
        this.tutorials = response.data.docs;
        this.currentPage = response.data.page || 1;
        this.totalPages = response.data.totalPages || 1;
        this.totalDocs = response.data.totalDocs || this.tutorials.length;

        // Búsqueda local combinada (Título y Categoría) - Útil si el backend aún no busca por texto libre
        if (this.searchTerm) {
          this.tutorials = this.tutorials.filter(
            (t) =>
              t.title.toLowerCase().includes(this.searchTerm) ||
              t.category.toLowerCase().includes(this.searchTerm),
          );
        }

        this.applySort(); // Mantiene la tabla ordenada tras recargar
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar tutoriales:', err);
        this.errorMessage = 'No se pudo cargar el catálogo de tutoriales.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  // --- Métodos de Ordenación ---
  toggleSort(column: keyof Tutorial) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySort();
    this.cdr.detectChanges();
  }

  private applySort() {
    if (!this.sortColumn) return;

    this.tutorials = [...this.tutorials].sort((a, b) => {
      let valA = a[this.sortColumn as keyof Tutorial];
      let valB = b[this.sortColumn as keyof Tutorial];

      if (valA === null || valA === undefined) valA = '';
      if (valB === null || valB === undefined) valB = '';

      if (typeof valA === 'string' && typeof valB === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // --- Métodos de Paginación ---
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadTutorials();
    }
  }

  nextPage() {
    this.goToPage(this.currentPage + 1);
  }
  prevPage() {
    this.goToPage(this.currentPage - 1);
  }

  // --- Gestión de Creación y Edición ---
  openCreateModal() {
    this.selectedTutorialForEdit = null; // Asegura que esté en modo creación
    this.isCreateModalOpen = true;
  }

  editTutorial(tutorial: Tutorial) {
    this.selectedTutorialForEdit = tutorial; // Pasa los datos al modo edición
    this.isCreateModalOpen = true;
  }

  handleSaveTutorial(payload: CreateTutorialPayload) {
    this.isSavingTutorial = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    if (this.selectedTutorialForEdit) {
      // Flujo de Edición
      this.tutorialService.updateTutorial(this.selectedTutorialForEdit._id, payload).subscribe({
        next: () => this.finalizeSave('¡Tutorial actualizado con éxito!'),
        error: (err) => this.handleSaveError(err),
      });
    } else {
      // Flujo de Creación
      this.tutorialService.createTutorial(payload).subscribe({
        next: () => this.finalizeSave('¡Tutorial creado con éxito!'),
        error: (err) => this.handleSaveError(err),
      });
    }
  }

  private finalizeSave(message: string) {
    this.isSavingTutorial = false;
    this.isCreateModalOpen = false;
    this.successMessage = message;
    this.loadTutorials();
  }

  private handleSaveError(err: any) {
    console.error('Error al guardar el tutorial:', err);
    this.isSavingTutorial = false;
    this.errorMessage = err.error?.message || 'Ocurrió un error al guardar el tutorial.';
    this.cdr.detectChanges();
  }

  // --- Gestión de Borrado ---
  requestDelete(tutorial: Tutorial) {
    this.deleteModal = {
      isOpen: true,
      isLoading: false,
      tutorialId: tutorial._id,
      tutorialTitle: tutorial.title,
    };
  }

  closeDeleteModal() {
    this.deleteModal.isOpen = false;
    this.deleteModal.isLoading = false;
    this.deleteModal.tutorialId = null;
  }

  executeDelete() {
    if (!this.deleteModal.tutorialId) return;

    this.deleteModal.isLoading = true;
    this.cdr.detectChanges();

    this.tutorialService.deleteTutorial(this.deleteModal.tutorialId).subscribe({
      next: () => {
        this.successMessage = 'Tutorial eliminado correctamente.';
        this.closeDeleteModal();
        this.loadTutorials();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Hubo un error al eliminar el tutorial.';
        this.closeDeleteModal();
        this.cdr.detectChanges();
      },
    });
  }
}
