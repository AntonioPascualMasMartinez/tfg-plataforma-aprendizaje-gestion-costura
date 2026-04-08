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
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommunityService } from '../../../core/services/community.service';
import { UserService } from '../../../core/services/user.service'; // <-- Inyectamos UserService para baneos
import { Report, ReportStatus } from '../../../shared/models/community.model';
import { ConfirmModalComponent } from '../../../shared/modals/confirm-modal/confirm-modal.component';

// Interfaz para centralizar el estado del modal de confirmación
interface ModalState {
  isOpen: boolean;
  isLoading: boolean;
  title: string;
  message: string;
  confirmText: string;
  isDestructive: boolean;
}

// Tipado para las acciones posibles en el panel
type ModerationAction = 'dismiss' | 'review' | 'delete_comment' | 'reopen' | 'ban_user';

@Component({
  selector: 'app-admin-moderation',
  standalone: true,
  imports: [DatePipe, ConfirmModalComponent, ReactiveFormsModule], // <-- Importar ReactiveFormsModule
  templateUrl: './moderation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush, // <-- Mejora 5: Optimización de rendimiento
})
export class ModerationComponent implements OnInit, OnDestroy {
  private communityService = inject(CommunityService);
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  reports: Report[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // --- Mejora 2: Pestañas de Estado Reactivas ---
  statusTab = new FormControl<ReportStatus>('Pending');

  // --- Mejora 5: Paginación Real ---
  currentPage = 1;
  limit = 20;
  totalDocs = 0;
  totalPages = 1;

  // --- Mejora 4: Estado Centralizado del Modal ---
  modalState: ModalState = {
    isOpen: false,
    isLoading: false,
    title: '',
    message: '',
    confirmText: '',
    isDestructive: false,
  };

  selectedReport: Report | null = null;
  pendingAction: ModerationAction | null = null;

  ngOnInit() {
    this.setupTabListener();
    this.loadReports();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Escucha los cambios de pestaña y recarga la tabla
  private setupTabListener() {
    this.statusTab.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.currentPage = 1; // Volver a la primera página al cambiar de pestaña
      this.loadReports();
    });
  }

  loadReports() {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();

    const currentStatus = this.statusTab.value || 'Pending';

    // Nota: Asumimos que getModerationQueue ahora acepta un tercer parámetro para el estado (status).
    // Deberás actualizar la firma en community.service.ts -> getModerationQueue(page, limit, status)
    this.communityService
      .getModerationQueue(this.currentPage, this.limit, currentStatus as any)
      .subscribe({
        next: (response) => {
          this.reports = response.data.docs;
          this.currentPage = response.data.page || 1;
          this.totalPages = response.data.totalPages || 1;
          this.totalDocs = response.data.totalDocs || this.reports.length;

          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al cargar reportes:', err);
          this.errorMessage = 'No se pudo cargar la cola de moderación.';
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  // --- Métodos de Paginación ---
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadReports();
    }
  }

  nextPage() {
    this.goToPage(this.currentPage + 1);
  }
  prevPage() {
    this.goToPage(this.currentPage - 1);
  }

  // --- Preparación de Acciones (Abre el modal) ---

  requestDismiss(report: Report) {
    this.selectedReport = report;
    this.pendingAction = 'dismiss';
    this.setModalState(
      'Desestimar Reporte',
      '¿Estás seguro de que deseas ignorar este reporte? Se marcará como desestimado y no se tomarán acciones.',
      'Desestimar',
      false,
    );
  }

  requestReview(report: Report) {
    this.selectedReport = report;
    this.pendingAction = 'review';
    this.setModalState(
      'Marcar como Revisado',
      '¿Marcar este reporte como resuelto indicando que ya se ha actuado en consecuencia?',
      'Marcar Resuelto',
      false,
    );
  }

  // Mejora 3: Sistema "Undo"
  requestReopen(report: Report) {
    this.selectedReport = report;
    this.pendingAction = 'reopen';
    this.setModalState(
      'Reabrir Reporte',
      '¿Estás seguro de devolver este reporte a la cola de pendientes? Esto te permitirá volver a tomar una decisión sobre él.',
      'Sí, reabrir',
      false,
    );
  }

  requestDeleteComment(report: Report) {
    this.selectedReport = report;
    this.pendingAction = 'delete_comment';
    this.setModalState(
      'Eliminar Comentario Reportado',
      '¿Estás seguro de que deseas borrar este comentario de la plataforma? Esta acción no se puede deshacer y el reporte se marcará como revisado automáticamente.',
      'Sí, eliminar comentario',
      true,
    );
  }

  // Mejora 4: Acciones Sancionadoras
  requestBanUser(report: Report) {
    this.selectedReport = report;
    this.pendingAction = 'ban_user';
    this.setModalState(
      'Banear Usuario',
      '¿Estás seguro de que deseas suspender la cuenta del autor de este contenido? No podrá iniciar sesión ni participar en la comunidad.',
      'Sí, banear usuario',
      true,
    );
  }

  private setModalState(
    title: string,
    message: string,
    confirmText: string,
    isDestructive: boolean,
  ) {
    this.modalState = {
      isOpen: true,
      isLoading: false,
      title,
      message,
      confirmText,
      isDestructive,
    };
  }

  // --- Ejecución de la Acción Confirmada ---

  executeAction() {
    if (!this.selectedReport || !this.pendingAction) return;
    this.modalState.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    switch (this.pendingAction) {
      case 'dismiss':
      case 'review':
      case 'reopen':
        const actionMap: Record<string, ReportStatus> = {
          dismiss: 'Dismissed',
          review: 'Reviewed',
          reopen: 'Pending',
        };
        const actionToTake = actionMap[this.pendingAction];

        this.communityService.resolveReport(this.selectedReport._id, actionToTake).subscribe({
          next: () => this.handleSuccess(`Reporte actualizado a: ${actionToTake}`),
          error: (err) => this.handleError(err),
        });
        break;

      case 'delete_comment':
        this.communityService.adminDeleteComment(this.selectedReport.targetId).subscribe({
          next: () => {
            // Marcamos como revisado tras borrar el comentario
            this.communityService.resolveReport(this.selectedReport!._id, 'Reviewed').subscribe({
              next: () => this.handleSuccess('Comentario eliminado y reporte resuelto.'),
              error: (err) => this.handleError(err),
            });
          },
          error: (err) => this.handleError(err),
        });
        break;

      case 'ban_user':
        // Asumiendo que el modelo Report tiene la propiedad 'reportedUserId'
        // Si tu backend no la expone aún, deberás añadirla en el controlador al devolver el reporte
        const userIdToBan = (this.selectedReport as any).reportedUserId;

        if (!userIdToBan) {
          this.handleError({
            error: { message: 'No se pudo identificar al autor del contenido.' },
          });
          return;
        }

        this.userService.toggleUserStatus(userIdToBan, false).subscribe({
          next: () => {
            this.communityService.resolveReport(this.selectedReport!._id, 'Reviewed').subscribe({
              next: () => this.handleSuccess('Usuario baneado exitosamente y reporte resuelto.'),
              error: (err) => this.handleError(err),
            });
          },
          error: (err) => this.handleError(err),
        });
        break;
    }
  }

  private handleSuccess(message: string) {
    this.successMessage = message;
    this.closeModal();
    this.loadReports(); // Recargamos para que el reporte desaparezca/cambie en la pestaña actual
  }

  private handleError(err: any) {
    this.errorMessage = err.error?.message || 'Hubo un error al procesar la acción.';
    this.closeModal();
    this.cdr.detectChanges();
  }

  closeModal() {
    this.modalState.isOpen = false;
    this.modalState.isLoading = false;
    this.selectedReport = null;
    this.pendingAction = null;
  }
}
