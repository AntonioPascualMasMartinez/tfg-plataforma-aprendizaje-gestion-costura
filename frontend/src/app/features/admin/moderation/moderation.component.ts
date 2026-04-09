/**
 * @file moderation.component.ts
 * @description Componente contenedor del panel de administración para la moderación de contenido.
 * Gestiona el ciclo de vida de los reportes emitidos por la comunidad, permitiendo su revisión,
 * desestimación o la aplicación de sanciones (borrado de contenido, suspensión de usuarios).
 * Se apoya en estrategias de renderizado OnPush y flujos reactivos (RxJS) para el filtrado por pestañas.
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
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommunityService } from '../../../core/services/community.service';
import { UserService } from '../../../core/services/user.service';
import { Report, ReportStatus } from '../../../shared/models/community.model';
import { ConfirmModalComponent } from '../../../shared/modals/confirm-modal/confirm-modal.component';

/**
 * Contrato de estructura para centralizar el estado transaccional de la ventana modal.
 */
interface ModalState {
  isOpen: boolean;
  isLoading: boolean;
  title: string;
  message: string;
  confirmText: string;
  isDestructive: boolean;
}

/**
 * Enumeración tipada de las directivas de moderación soportadas por el sistema.
 */
type ModerationAction = 'dismiss' | 'review' | 'delete_comment' | 'reopen' | 'ban_user';

@Component({
  selector: 'app-admin-moderation',
  standalone: true,
  imports: [DatePipe, ConfirmModalComponent, ReactiveFormsModule],
  templateUrl: './moderation.component.html',
  /* Optimización estricta del árbol de componentes para minimizar los ciclos de renderizado. */
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModerationComponent implements OnInit, OnDestroy {
  private communityService = inject(CommunityService);
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);

  /** Sujeto emisor para el control de fugas de memoria en las suscripciones activas. */
  private destroy$ = new Subject<void>();

  reports: Report[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  /** Control reactivo para la navegación contextual entre estados del reporte. */
  statusTab = new FormControl<ReportStatus>('Pending');

  /* Metadatos de la estructura de paginación del lado del servidor. */
  currentPage = 1;
  limit = 20;
  totalDocs = 0;
  totalPages = 1;

  /** Estado centralizado de la interfaz de confirmación. */
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

  ngOnInit(): void {
    this.setupTabListener();
    this.loadReports();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa la escucha sobre el control reactivo de pestañas.
   * Restablece el cursor de paginación y desencadena la actualización del repositorio de datos.
   */
  private setupTabListener(): void {
    this.statusTab.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.currentPage = 1;
      this.loadReports();
    });
  }

  /**
   * Sincroniza la vista con el estado persistente del servidor mediante peticiones HTTP.
   */
  loadReports(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();

    const currentStatus = this.statusTab.value || 'Pending';

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
          console.error('Anomalía en la recuperación de la cola de moderación:', err);
          this.errorMessage = 'No se pudo cargar la cola de moderación.';
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  /* ==========================================================================
     MÉTODOS DE PAGINACIÓN ALGORÍTMICA
     ========================================================================== */

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadReports();
    }
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  /* ==========================================================================
     MÉTODOS DE PREPARACIÓN DE ACCIONES (Lógica de Interfaz)
     ========================================================================== */

  requestDismiss(report: Report): void {
    this.selectedReport = report;
    this.pendingAction = 'dismiss';
    this.setModalState(
      'Desestimar Reporte',
      '¿Estás seguro de que deseas ignorar este reporte? Se marcará como desestimado y no se tomarán acciones.',
      'Desestimar',
      false,
    );
  }

  requestReview(report: Report): void {
    this.selectedReport = report;
    this.pendingAction = 'review';
    this.setModalState(
      'Marcar como Revisado',
      '¿Marcar este reporte como resuelto indicando que ya se ha actuado en consecuencia?',
      'Marcar Resuelto',
      false,
    );
  }

  /**
   * Facilita la reversión de decisiones administrativas devolviendo un incidente a la cola de atención.
   */
  requestReopen(report: Report): void {
    this.selectedReport = report;
    this.pendingAction = 'reopen';
    this.setModalState(
      'Reabrir Reporte',
      '¿Estás seguro de devolver este reporte a la cola de pendientes? Esto te permitirá volver a tomar una decisión sobre él.',
      'Sí, reabrir',
      false,
    );
  }

  requestDeleteComment(report: Report): void {
    this.selectedReport = report;
    this.pendingAction = 'delete_comment';
    this.setModalState(
      'Eliminar Comentario Reportado',
      '¿Estás seguro de que deseas borrar este comentario de la plataforma? Esta acción no se puede deshacer y el reporte se marcará como revisado automáticamente.',
      'Sí, eliminar comentario',
      true,
    );
  }

  requestBanUser(report: Report): void {
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
  ): void {
    this.modalState = {
      isOpen: true,
      isLoading: false,
      title,
      message,
      confirmText,
      isDestructive,
    };
  }

  /* ==========================================================================
     RESOLUCIÓN DE EVENTOS DE NEGOCIO
     ========================================================================== */

  /**
   * Orquesta la ejecución final de la resolución evaluando el tipo de acción penal.
   * Contempla escenarios de composición asíncrona, donde la sanción sobre un usuario
   * o comentario desencadena, en cascada, la resolución exitosa del reporte original.
   */
  executeAction(): void {
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
            /* Ejecución anidada: Marcado como revisado tras corroborar la eliminación efectiva */
            this.communityService.resolveReport(this.selectedReport!._id, 'Reviewed').subscribe({
              next: () => this.handleSuccess('Comentario eliminado y reporte resuelto.'),
              error: (err) => this.handleError(err),
            });
          },
          error: (err) => this.handleError(err),
        });
        break;

      case 'ban_user':
        /* Extracción segura del atributo analítico de la entidad */
        const userIdToBan = (this.selectedReport as any).reportedUserId;

        if (!userIdToBan) {
          this.handleError({
            error: { message: 'No se pudo identificar al autor del contenido.' },
          });
          return;
        }

        this.userService.toggleUserStatus(userIdToBan, false).subscribe({
          next: () => {
            /* Ejecución anidada: Resolución del reporte derivada del baneo */
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

  private handleSuccess(message: string): void {
    this.successMessage = message;
    this.closeModal();
    this.loadReports();
  }

  private handleError(err: any): void {
    this.errorMessage = err.error?.message || 'Hubo un error al procesar la acción de moderación.';
    this.closeModal();
    this.cdr.detectChanges();
  }

  closeModal(): void {
    this.modalState.isOpen = false;
    this.modalState.isLoading = false;
    this.selectedReport = null;
    this.pendingAction = null;
  }
}
