import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core'; // <-- 1. Importar
import { DatePipe } from '@angular/common';
import { TutorialService } from '../../../core/services/tutorial.service';
import { Tutorial, CreateTutorialPayload } from '../../../shared/models/tutorial.model';
import { CreateTutorialModalComponent } from '../../../shared/modals/create-tutorial-modal/create-tutorial-modal.component';

@Component({
  selector: 'app-admin-tutorials',
  standalone: true,
  imports: [DatePipe, CreateTutorialModalComponent],
  templateUrl: './tutorials.component.html',
})
export class TutorialsComponent implements OnInit {
  private tutorialService = inject(TutorialService);
  private cdr = inject(ChangeDetectorRef); // <-- 2. Inyectar

  tutorials: Tutorial[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Variables de paginación
  currentPage = 1;
  totalPages = 1;
  totalDocs = 0;

  // --- Variables para el control del Modal ---
  isCreateModalOpen = false;
  isSavingTutorial = false;

  ngOnInit() {
    this.loadTutorials();
  }

  loadTutorials(page: number = 1) {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges(); // <-- Actualizamos al inicio de la carga

    this.tutorialService.getCatalog(page, 10).subscribe({
      next: (response) => {
        this.tutorials = response.data.docs;
        this.currentPage = response.data.page;
        this.totalPages = response.data.totalPages;
        this.totalDocs = response.data.totalDocs;
        this.isLoading = false;
        this.cdr.detectChanges(); // <-- 3. Refrescar tabla de tutoriales
      },
      error: (err) => {
        console.error('Error al cargar tutoriales:', err);
        this.errorMessage = 'No se pudo cargar el catálogo de tutoriales.';
        this.isLoading = false;
        this.cdr.detectChanges(); // <-- 3. Refrescar al fallar
      },
    });
  }

  // --- Métodos del Modal de Creación ---

  openCreateModal() {
    this.isCreateModalOpen = true;
  }

  handleCreateTutorial(payload: CreateTutorialPayload) {
    this.isSavingTutorial = true;
    this.errorMessage = '';
    this.cdr.detectChanges(); // <-- Mostrar estado de carga en el modal

    this.tutorialService.createTutorial(payload).subscribe({
      next: (response) => {
        this.isSavingTutorial = false;
        this.isCreateModalOpen = false;
        this.successMessage = '¡Tutorial creado con éxito!';

        this.loadTutorials(1); // La recarga interna llamará a su propio detectChanges
      },
      error: (err) => {
        console.error('Error al crear el tutorial:', err);
        this.isSavingTutorial = false;
        this.errorMessage = err.error?.message || 'Ocurrió un error al guardar el tutorial.';
        this.cdr.detectChanges(); // <-- Mostrar mensaje de error en el modal
      },
    });
  }

  // --- Métodos placeholder para futuras acciones ---

  editTutorial(tutorial: Tutorial) {
    console.log('Editar tutorial:', tutorial._id);
  }

  deleteTutorial(tutorialId: string) {
    console.log('Eliminar tutorial:', tutorialId);
  }
}
