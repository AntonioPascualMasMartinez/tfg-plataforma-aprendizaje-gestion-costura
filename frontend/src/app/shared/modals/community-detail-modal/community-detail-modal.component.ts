/**
 * @file community-detail-modal.component.ts
 * @description Componente modal interactivo para la visualización en detalle de un proyecto de la comunidad.
 * Permite al usuario revisar la información del proyecto, leer comentarios, reportar contenido
 * y, de manera central, orquestar el proceso de clonación ("Adaptado de la Comunidad")
 * hacia el entorno de trabajo personal (taller).
 */
import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, from, of } from 'rxjs';
import { concatMap, finalize, toArray } from 'rxjs/operators';

import { CommunityService } from '../../../core/services/community.service';
import { ProjectService } from '../../../core/services/project.service';
import { ToastService } from '../../../core/services/toast.service';
import { CommunityProject } from '../../components/community-card/community-card.component';
import { Comment, CreateReportPayload } from '../../../shared/models/community.model';
import {
  Project,
  CreateProjectPayload,
  AddStepPayload,
} from '../../../shared/models/project.model';
import { User } from '../../../shared/models/user.model';
import { ReportModalComponent } from '../report-modal/report-modal.component';

@Component({
  selector: 'app-community-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReportModalComponent],
  templateUrl: './community-detail-modal.component.html',
})
export class CommunityDetailModalComponent implements OnInit {
  /** Instancia del proyecto de la comunidad a visualizar. */
  @Input({ required: true }) project!: CommunityProject;

  /** Evento emitido para solicitar el cierre de la ventana modal. */
  @Output() close = new EventEmitter<void>();

  /** Evento emitido al producirse una actualización relevante en el proyecto. */
  @Output() projectUpdated = new EventEmitter<CommunityProject>();

  private communityService = inject(CommunityService);
  private projectService = inject(ProjectService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  /** Indicador de estado para la carga asíncrona de comentarios. */
  isLoadingComments = true;

  /** Indicador de estado para el bloqueo de interfaz durante la clonación del proyecto. */
  isCloning = false;

  comments: Comment[] = [];
  totalComments = 0;

  showReportModal = false;
  projectToReport: any = null;

  ngOnInit(): void {
    this.loadComments();
  }

  /**
   * Recupera de forma paginada los comentarios asociados al proyecto.
   */
  loadComments(): void {
    this.isLoadingComments = true;
    this.communityService.getProjectComments(this.project._id, 1, 10).subscribe({
      next: (res) => {
        this.comments = res.data.docs;
        this.totalComments = res.data.totalDocs;
        this.isLoadingComments = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingComments = false;
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Ejecuta la orquestación secuencial para clonar un proyecto de la comunidad.
   * Inicializa la instancia base del proyecto y encadena la inserción de pasos iterativos
   * manteniendo la integridad relacional y de orden.
   */
  startProject(): void {
    if (this.isCloning) return;

    this.isCloning = true;
    this.cdr.detectChanges();

    const createPayload: CreateProjectPayload = {
      title: this.project.title,
      projectType: 'Adaptado de la Comunidad',
      originalProjectId: this.project._id,
      category: this.project.category,
      difficulty: this.project.difficulty,
      inspirationImageUrl: this.project.inspirationImageUrl,
      description: this.project.description,
      status: 'Planificado',
      isPublic: false,
      materials: this.project.materials.map((m) => ({
        name: m.name,
        quantity: m.quantity,
        notes: m.notes,
      })),
    };

    /* 1. Persistencia de la entidad raíz (Proyecto) */
    this.projectService.createProject(createPayload).subscribe({
      next: (response) => {
        const newProject = response.data;

        /* 2. Inserción secuencial de pasos para evitar condiciones de carrera (Race Conditions) */
        if (this.project.steps && this.project.steps.length > 0) {
          from(this.project.steps)
            .pipe(
              concatMap((step) => {
                const stepPayload: AddStepPayload = {
                  title: step.title,
                  description: step.description,
                  mediaUrl: step.mediaUrl,
                  status: 'Pendiente',
                };
                return this.projectService.addStepToProject(newProject._id, stepPayload);
              }),
              toArray(),
            )
            .subscribe({
              next: () => this.finalizeCloning(newProject._id),
              error: () => this.handleCloneError(),
            });
        } else {
          this.finalizeCloning(newProject._id);
        }
      },
      error: () => this.handleCloneError(),
    });
  }

  /**
   * Finaliza el flujo de clonación de manera exitosa y redirige al taller.
   * @param {string} newId - Identificador del nuevo proyecto generado.
   */
  private finalizeCloning(newId: string): void {
    this.isCloning = false;
    this.toastService.success('¡Patrón añadido! Abriendo tu mesa de trabajo...');
    this.closeModal();
    this.router.navigate(['/home/proyectos', newId]);
  }

  /**
   * Gestiona excepciones durante la creación secuencial del clon.
   */
  private handleCloneError(): void {
    this.isCloning = false;
    this.toastService.error('Hubo un error al preparar el taller. Inténtalo de nuevo.');
    this.cdr.detectChanges();
  }

  closeModal(): void {
    this.close.emit();
  }

  /**
   * Resolución de seguridad del identificador de autor para prevenir errores de referencia nula.
   */
  getAuthorName(ownerId: any): string {
    if (ownerId && typeof ownerId === 'object' && 'displayName' in ownerId) {
      return ownerId.displayName || 'Anónimo';
    }
    return 'Anónimo';
  }

  /**
   * Obtiene la imagen de avatar del autor o genera un placeholder visual.
   */
  getAuthorAvatar(ownerId: any): string {
    if (ownerId && typeof ownerId === 'object' && 'avatar' in ownerId && ownerId.avatar) {
      return ownerId.avatar;
    }
    const name = this.getAuthorName(ownerId);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ffedd5&color=ea580c&rounded=true&bold=true`;
  }

  /**
   * Inicializa la vista de reporte para el proyecto o para un comentario.
   */
  openReportModal(target: any, type: 'Project' | 'Comment'): void {
    this.projectToReport = {
      targetId: target._id,
      targetType: type,
      title:
        type === 'Project' ? target.title : `Comentario de ${this.getAuthorName(target.authorId)}`,
    };
    this.showReportModal = true;
    this.cdr.detectChanges();
  }

  /**
   * Gestiona el envío del reporte capturando el evento del modal hijo y procediendo
   * a la petición HTTP de creación.
   */
  onReportSubmitted(eventData: CreateReportPayload): void {
    const payload: CreateReportPayload = {
      targetId: this.projectToReport.targetId,
      targetType: this.projectToReport.targetType,
      reason: eventData.reason,
    };

    this.communityService.createReport(payload).subscribe({
      next: () => {
        this.toastService.success('Reporte enviado correctamente.');
        this.showReportModal = false;
        this.projectToReport = null;
        this.cdr.detectChanges();
      },
      error: () => {
        this.toastService.error('Error al enviar el reporte. Inténtalo de nuevo.');
        this.showReportModal = false;
        this.projectToReport = null;
        this.cdr.detectChanges();
      },
    });
  }
}
