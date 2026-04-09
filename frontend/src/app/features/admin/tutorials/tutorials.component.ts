/**
 * @file tutorials.component.ts
 * @description Módulo administrativo integral para la gestión (CRUD) del catálogo formativo.
 * Orquesta la presentación tabular de las unidades didácticas y centraliza el manejo de modales
 * para la autoría, modificación y purgado de los recursos pedagógicos.
 */
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

/**
 * DTO interno para el seguimiento del estado asíncrono del flujo de borrado.
 */
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TutorialsComponent implements OnInit, OnDestroy {
  private tutorialService = inject(TutorialService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  tutorials: Tutorial[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  /* Controles reactivos de filtrado bidimensional (Texto libre y Selectores categóricos) */
  searchControl = new FormControl('');
  difficultyControl = new FormControl('');
  searchTerm = '';

  /* Variables de control de Paginación */
  currentPage = 1;
  limit = 10;
  totalPages = 1;
  totalDocs = 0;

  /* Criterios de ordenación matricial */
  sortColumn: keyof Tutorial | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  /* Interfaz transaccional: Creación y Edición */
  isCreateModalOpen = false;
  isSavingTutorial = false;
  selectedTutorialForEdit: Tutorial | null = null;

  /* Interfaz transaccional: Supresión de registros */
  deleteModal: DeleteModalState = {
    isOpen: false,
    isLoading: false,
    tutorialId: null,
    tutorialTitle: '',
  };

  ngOnInit(): void {
    this.setupFilters();
    this.loadTutorials();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Unifica los flujos de eventos procedentes de múltiples inputs reactivos.
   * Dispara una re-carga del catálogo tras estabilizarse la entrada del usuario.
   */
  private setupFilters(): void {
    merge(this.searchControl.valueChanges, this.difficultyControl.valueChanges)
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.searchTerm = this.searchControl.value?.toLowerCase() || '';
        this.currentPage = 1;
        this.loadTutorials();
      });
  }

  /**
   * Extrae la colección formativa de la base de datos inyectando los parámetros
   * de redimensionamiento (paginación) y categorización (dificultad).
   */
  loadTutorials(): void {
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

        if (this.searchTerm) {
          this.tutorials = this.tutorials.filter(
            (t) =>
              t.title.toLowerCase().includes(this.searchTerm) ||
              t.category.toLowerCase().includes(this.searchTerm),
          );
        }

        this.applySort();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Excepción crítica durante la indexación de tutoriales:', err);
        this.errorMessage = 'No se pudo cargar el catálogo de tutoriales.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  toggleSort(column: keyof Tutorial): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySort();
    this.cdr.detectChanges();
  }

  /**
   * Ejecuta la reordenación vectorial respetando la estrategia OnPush.
   */
  private applySort(): void {
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

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadTutorials();
    }
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  /**
   * Despliega la interfaz modal configurando su contexto como "Creación de Nuevo Recurso".
   */
  openCreateModal(): void {
    this.selectedTutorialForEdit = null;
    this.isCreateModalOpen = true;
  }

  /**
   * Despliega la interfaz modal inyectando la entidad base y configurando el contexto en "Modo Edición".
   * @param {Tutorial} tutorial - Estructura de datos origen a editar.
   */
  editTutorial(tutorial: Tutorial): void {
    this.selectedTutorialForEdit = tutorial;
    this.isCreateModalOpen = true;
  }

  /**
   * Resolutor centralizado del componente modal.
   * Determina la acción HTTP en función del estado de contexto (PATCH vs POST).
   * @param {CreateTutorialPayload} payload - Modelo de datos validado y estructurado.
   */
  handleSaveTutorial(payload: CreateTutorialPayload): void {
    this.isSavingTutorial = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    if (this.selectedTutorialForEdit) {
      this.tutorialService.updateTutorial(this.selectedTutorialForEdit._id, payload).subscribe({
        next: () => this.finalizeSave('¡Tutorial actualizado con éxito!'),
        error: (err) => this.handleSaveError(err),
      });
    } else {
      this.tutorialService.createTutorial(payload).subscribe({
        next: () => this.finalizeSave('¡Tutorial creado con éxito!'),
        error: (err) => this.handleSaveError(err),
      });
    }
  }

  /**
   * Cierre exitoso del flujo de guardado, demolición de la ventana y sincronización tabular.
   */
  private finalizeSave(message: string): void {
    this.isSavingTutorial = false;
    this.isCreateModalOpen = false;
    this.successMessage = message;
    this.loadTutorials();
  }

  private handleSaveError(err: any): void {
    console.error('Rechazo del backend durante la persistencia del tutorial:', err);
    this.isSavingTutorial = false;
    this.errorMessage =
      err.error?.message || 'Ocurrió un error de validación u originado en el servidor.';
    this.cdr.detectChanges();
  }

  requestDelete(tutorial: Tutorial): void {
    this.deleteModal = {
      isOpen: true,
      isLoading: false,
      tutorialId: tutorial._id,
      tutorialTitle: tutorial.title,
    };
  }

  closeDeleteModal(): void {
    this.deleteModal.isOpen = false;
    this.deleteModal.isLoading = false;
    this.deleteModal.tutorialId = null;
  }

  executeDelete(): void {
    if (!this.deleteModal.tutorialId) return;

    this.deleteModal.isLoading = true;
    this.cdr.detectChanges();

    this.tutorialService.deleteTutorial(this.deleteModal.tutorialId).subscribe({
      next: () => {
        this.successMessage = 'Tutorial eliminado correctamente de la plataforma.';
        this.closeDeleteModal();
        this.loadTutorials();
      },
      error: (err) => {
        this.errorMessage =
          err.error?.message || 'Hubo un error de integridad al eliminar el tutorial.';
        this.closeDeleteModal();
        this.cdr.detectChanges();
      },
    });
  }
}
