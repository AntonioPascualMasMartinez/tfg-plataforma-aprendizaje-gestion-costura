import { Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TutorialService } from '../../../core/services/tutorial.service';
import { Tutorial } from '../../../shared/models/tutorial.model';

@Component({
  selector: 'app-admin-tutorials',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './tutorials.component.html',
})
export class TutorialsComponent implements OnInit {
  private tutorialService = inject(TutorialService);

  tutorials: Tutorial[] = [];
  isLoading = false;
  errorMessage = '';

  // Variables de paginación
  currentPage = 1;
  totalPages = 1;
  totalDocs = 0;

  ngOnInit() {
    this.loadTutorials();
  }

  loadTutorials(page: number = 1) {
    this.isLoading = true;
    this.errorMessage = '';

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
      }
    });
  }

  // Métodos placeholder para futuras acciones
  openCreateModal() {
    console.log('Abrir modal para crear tutorial oficial');
  }

  editTutorial(tutorial: Tutorial) {
    console.log('Editar tutorial:', tutorial._id);
  }

  deleteTutorial(tutorialId: string) {
    console.log('Eliminar tutorial:', tutorialId);
    // Nota: Aún no tienes el endpoint de DELETE en tu tutorial.service.ts
  }
}