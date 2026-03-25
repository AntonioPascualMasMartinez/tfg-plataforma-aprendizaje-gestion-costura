import { Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TutorialService } from '../../../core/services/tutorial.service';
import { Tutorial, CreateTutorialPayload } from '../../../shared/models/tutorial.model';
// Asegúrate de ajustar la ruta según dónde hayas guardado el componente del modal
import { CreateTutorialModalComponent } from '../../../shared/modals/create-tutorial-modal/create-tutorial-modal.component';

@Component({
  selector: 'app-admin-tutorials',
  standalone: true,
  // AÑADIDO: Importamos el modal aquí
  imports: [DatePipe, CreateTutorialModalComponent],
  templateUrl: './tutorials.component.html',
})
export class TutorialsComponent implements OnInit {
  private tutorialService = inject(TutorialService);

  tutorials: Tutorial[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = ''; // Añadido para dar feedback al usuario

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

    this.tutorialService.getCatalog(page, 10).subscribe({
      next: (response) => {
        this.tutorials = response.data.docs;
        this.currentPage = response.data.page;
        this.totalPages = response.data.totalPages;
        this.totalDocs = response.data.totalDocs;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar tutoriales:', err);
        this.errorMessage = 'No se pudo cargar el catálogo de tutoriales.';
        this.isLoading = false;
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

    this.tutorialService.createTutorial(payload).subscribe({
      next: (response) => {
        this.isSavingTutorial = false;
        this.isCreateModalOpen = false;
        this.successMessage = '¡Tutorial creado con éxito!';

        // Recargamos la primera página para ver el nuevo tutorial en la lista
        this.loadTutorials(1);
      },
      error: (err) => {
        console.error('Error al crear el tutorial:', err);
        this.isSavingTutorial = false;
        this.errorMessage = err.error?.message || 'Ocurrió un error al guardar el tutorial.';
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
