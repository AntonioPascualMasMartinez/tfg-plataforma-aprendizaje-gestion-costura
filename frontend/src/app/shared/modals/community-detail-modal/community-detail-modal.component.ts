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
  @Input({ required: true }) project!: CommunityProject;
  @Output() close = new EventEmitter<void>();
  @Output() projectUpdated = new EventEmitter<CommunityProject>();

  private communityService = inject(CommunityService);
  private projectService = inject(ProjectService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // Estados de carga
  isLoadingComments = true;
  isCloning = false;

  // Datos de comunidad
  comments: Comment[] = [];
  totalComments = 0;

  // Reportes
  showReportModal = false;
  projectToReport: any = null;

  ngOnInit() {
    this.loadComments();
  }

  /**
   * Carga los comentarios del proyecto para mostrarlos como valoraciones
   */
  loadComments() {
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
   * Orquestación de clonado:
   * 1. Crea el proyecto base.
   * 2. Itera y añade los pasos uno a uno para mantener el orden.
   */
  startProject() {
    if (this.isCloning) return;

    this.isCloning = true;
    this.cdr.detectChanges();

    // Preparamos el payload base
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

    // 1. Creamos el proyecto
    this.projectService.createProject(createPayload).subscribe({
      next: (response) => {
        const newProject = response.data;

        // 2. Si hay pasos, los añadimos secuencialmente para garantizar el orden
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
              toArray(), // Esperamos a que todos terminen
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

  private finalizeCloning(newId: string) {
    this.isCloning = false;
    this.toastService.success('¡Patrón añadido! Abriendo tu mesa de trabajo...');
    this.closeModal();
    this.router.navigate(['/home/proyectos', newId]); // Vamos directo al workshop
  }

  private handleCloneError() {
    this.isCloning = false;
    this.toastService.error('Hubo un error al preparar el taller. Inténtalo de nuevo.');
    this.cdr.detectChanges();
  }

  closeModal() {
    this.close.emit();
  }

  // Helpers de visualización
  getAuthorName(ownerId: any): string {
    if (ownerId && typeof ownerId === 'object' && 'displayName' in ownerId) {
      return ownerId.displayName || 'Anónimo';
    }
    return 'Anónimo';
  }

  getAuthorAvatar(ownerId: any): string {
    if (ownerId && typeof ownerId === 'object' && 'avatar' in ownerId && ownerId.avatar) {
      return ownerId.avatar;
    }
    const name = this.getAuthorName(ownerId);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ffedd5&color=ea580c&rounded=true&bold=true`;
  }

  openReportModal(target: any, type: 'Project' | 'Comment') {
    this.projectToReport = {
      targetId: target._id,
      targetType: type,
      title:
        type === 'Project' ? target.title : `Comentario de ${this.getAuthorName(target.authorId)}`,
    };
    this.showReportModal = true;
    this.cdr.detectChanges();
  }

  onReportSubmitted(eventData: any) {
    // Si tu modal emite directamente el string con el motivo (lo más habitual)
    const reasonText = typeof eventData === 'string' ? eventData : eventData.reason;

    // Construimos el payload completo aquí en el padre
    const payload: CreateReportPayload = {
      targetId: this.projectToReport.targetId,
      targetType: this.projectToReport.targetType,
      reason: reasonText,
    };

    this.communityService.createReport(payload).subscribe({
      next: () => {
        this.toastService.success('Reporte enviado correctamente.');
        this.showReportModal = false;
        this.projectToReport = null;
        this.cdr.detectChanges();
      },
      error: () => this.toastService.error('Error al enviar el reporte.'),
    });
  }
}
