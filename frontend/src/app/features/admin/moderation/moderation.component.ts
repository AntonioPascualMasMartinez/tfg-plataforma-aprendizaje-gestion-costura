import { Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CommunityService } from '../../../core/services/community.service';
import { Report, ReportStatus } from '../../../shared/models/community.model';
import { ConfirmModalComponent } from '../../../shared/modals/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-admin-moderation',
  standalone: true,
  imports: [DatePipe, ConfirmModalComponent],
  templateUrl: './moderation.component.html',
})
export class ModerationComponent implements OnInit {
  private communityService = inject(CommunityService);

  reports: Report[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // --- Estados del Modal ---
  isModalOpen = false;
  modalTitle = '';
  modalMessage = '';
  modalConfirmText = '';
  isModalDestructive = false;
  isModalLoading = false;

  // --- Variables para la acción pendiente ---
  selectedReport: Report | null = null;
  pendingAction: 'dismiss' | 'review' | 'delete_comment' | null = null;

  ngOnInit() {
    this.loadReports();
  }

  loadReports(page: number = 1) {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.communityService.getModerationQueue(page, 20).subscribe({
      next: (response) => {
        this.reports = response.data.docs;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar reportes:', err);
        this.errorMessage = 'No se pudo cargar la cola de moderación.';
        this.isLoading = false;
      },
    });
  }

  // --- Preparación de Acciones (Abre el modal) ---

  requestDismiss(report: Report) {
    this.selectedReport = report;
    this.pendingAction = 'dismiss';
    this.modalTitle = 'Desestimar Reporte';
    this.modalMessage = '¿Estás seguro de que deseas ignorar este reporte? Se marcará como desestimado.';
    this.modalConfirmText = 'Desestimar';
    this.isModalDestructive = false;
    this.isModalOpen = true;
  }

  requestReview(report: Report) {
    this.selectedReport = report;
    this.pendingAction = 'review';
    this.modalTitle = 'Marcar como Revisado';
    this.modalMessage = '¿Marcar este reporte como resuelto sin borrar el contenido original?';
    this.modalConfirmText = 'Marcar Resuelto';
    this.isModalDestructive = false;
    this.isModalOpen = true;
  }

  requestDeleteComment(report: Report) {
    this.selectedReport = report;
    this.pendingAction = 'delete_comment';
    this.modalTitle = 'Eliminar Comentario Reportado';
    this.modalMessage = '¿Estás seguro de que deseas borrar este comentario de la plataforma? Esta acción no se puede deshacer y el reporte se marcará como revisado.';
    this.modalConfirmText = 'Sí, eliminar comentario';
    this.isModalDestructive = true;
    this.isModalOpen = true;
  }

  // --- Ejecución de la Acción Confirmada ---

  executeAction() {
    if (!this.selectedReport || !this.pendingAction) return;
    this.isModalLoading = true;
    this.errorMessage = '';

    if (this.pendingAction === 'dismiss' || this.pendingAction === 'review') {
      const actionToTake: 'Reviewed' | 'Dismissed' = this.pendingAction === 'dismiss' ? 'Dismissed' : 'Reviewed';
      
      this.communityService.resolveReport(this.selectedReport._id, actionToTake).subscribe({
        next: (response) => {
          this.updateLocalReport(response.data);
          this.successMessage = `Reporte marcado como ${actionToTake}.`;
          this.closeModal();
        },
        error: (err) => this.handleError(err)
      });

    } else if (this.pendingAction === 'delete_comment') {
      // 1. Borramos el comentario
      this.communityService.adminDeleteComment(this.selectedReport.targetId).subscribe({
        next: () => {
          // 2. Si se borra con éxito, marcamos el reporte como revisado automáticamente
          this.communityService.resolveReport(this.selectedReport!._id, 'Reviewed').subscribe({
            next: (response) => {
              this.updateLocalReport(response.data);
              this.successMessage = 'Comentario eliminado y reporte resuelto.';
              this.closeModal();
            },
            error: (err) => this.handleError(err)
          });
        },
        error: (err) => this.handleError(err)
      });
    }
  }

  private updateLocalReport(updatedReport: Report) {
    const index = this.reports.findIndex(r => r._id === updatedReport._id);
    if (index !== -1) {
      this.reports[index] = updatedReport;
    }
  }

  private handleError(err: any) {
    this.errorMessage = err.error?.message || 'Hubo un error al procesar la acción.';
    this.closeModal();
  }

  closeModal() {
    this.isModalOpen = false;
    this.isModalLoading = false;
    this.selectedReport = null;
    this.pendingAction = null;
  }
}