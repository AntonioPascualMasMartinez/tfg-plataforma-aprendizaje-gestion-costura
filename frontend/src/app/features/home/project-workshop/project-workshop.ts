/**
 * @file project-workshop.ts
 * @description Componente controlador del "Taller", el entorno interactivo donde el usuario
 * ejecuta y documenta su progreso en un proyecto de costura.
 * Gestiona la navegación secuencial de pasos, el marcado de materiales, una bitácora con
 * autoguardado y la integración con el feed de comentarios de la comunidad original.
 */
import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectorRef,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, forkJoin } from 'rxjs';
import { debounceTime, takeUntil, distinctUntilChanged } from 'rxjs/operators';

import { ProjectService } from '../../../core/services/project.service';
import { CommunityService } from '../../../core/services/community.service';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { Project } from '../../../shared/models/project.model';
import { Comment } from '../../../shared/models/community.model';

/** Definición de las áreas funcionales del taller */
type WorkshopTab = 'pasos' | 'materiales' | 'bitacora' | 'comunidad';

@Component({
  selector: 'app-project-workshop',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './project-workshop.html',
})
export class ProjectWorkshop implements OnInit, OnDestroy {
  /* Inyección de servicios para lógica de negocio y navegación */
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private communityService = inject(CommunityService);
  private userService = inject(UserService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  /* --- ESTADO DE LA ENTIDAD Y CONTEXTO DE USUARIO --- */
  project: Project | null = null;
  isLoading = true;
  currentUserId: string | null = null;
  isOwner = false;

  /* --- ATRIBUCIÓN Y DATOS DE ORIGEN (Para proyectos adaptados) --- */
  originalProject: Project | null = null;
  comments: Comment[] = [];
  isLoadingComments = false;

  /* --- CONTROL DE LA INTERFAZ DE USUARIO --- */
  activeTab: WorkshopTab = 'pasos';
  activeStepIndex = 0;

  /* --- SISTEMA DE BITÁCORA PRIVADA (Gestión Reactiva) --- */
  notesControl = new FormControl('');
  isSavingNotes = false;
  lastSavedTime: Date | null = null;

  /* --- GESTIÓN DE INTERACCIONES PÚBLICAS --- */
  newCommentControl = new FormControl('', [Validators.required]);
  isSubmittingComment = false;

  /** Sujeto para la gestión de ciclo de vida y limpieza de observables */
  private destroy$ = new Subject<void>();

  ngOnInit() {
    const projectId = this.route.snapshot.paramMap.get('id');
    if (!projectId) {
      this.router.navigate(['/home/proyectos']);
      return;
    }
    this.initWorkshop(projectId);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa el entorno del taller recuperando simultáneamente los datos del usuario
   * y del proyecto. Configura la propiedad de autoría y el sistema de autoguardado.
   * @param id Identificador único del proyecto (clon o propio).
   */
  private initWorkshop(id: string): void {
    this.isLoading = true;

    forkJoin({
      projectRes: this.projectService.getProjectById(id),
      userRes: this.userService.getMe(),
    }).subscribe({
      next: ({ projectRes, userRes }) => {
        this.project = projectRes.data;
        this.currentUserId = userRes.data._id;

        // Evaluación de autoría para permisos de edición
        const ownerId =
          typeof this.project.ownerId === 'string'
            ? this.project.ownerId
            : this.project.ownerId?._id;
        this.isOwner = this.currentUserId === ownerId;

        // Inicialización de la bitácora de aprendizaje
        this.notesControl.setValue(this.project.learningNotes || '', { emitEvent: false });
        this.setupAutoSave();

        // En proyectos adaptados, se recupera la información de la fuente original para atribución
        if (
          this.project.projectType === 'Adaptado de la Comunidad' &&
          this.project.originalProjectId
        ) {
          this.loadOriginalData(this.project.originalProjectId);
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.toastService.error('Error al cargar el taller.');
        this.router.navigate(['/home/proyectos']);
      },
    });
  }

  /**
   * Recupera la entidad original para gestionar créditos y el flujo de comentarios.
   */
  private loadOriginalData(originalId: string): void {
    this.projectService.getProjectById(originalId).subscribe({
      next: (res) => {
        this.originalProject = res.data;
        this.loadComments();
        this.cdr.detectChanges();
      },
    });
  }

  /* ==========================================================================
     GESTIÓN DE PROGRESO Y PASOS INSTRUCTIVOS
     ========================================================================== */

  nextStep(): void {
    if (this.project && this.activeStepIndex < this.project.steps.length - 1) {
      this.activeStepIndex++;
      this.scrollToTop();
    }
  }

  prevStep(): void {
    if (this.activeStepIndex > 0) {
      this.activeStepIndex--;
      this.scrollToTop();
    }
  }

  /**
   * Actualiza el estado de completado de un paso.
   * Implementa una transición automática al siguiente paso tras una actualización exitosa.
   */
  toggleStepStatus(index: number): void {
    if (!this.project) return;
    const step = this.project.steps[index];
    step.status = step.status === 'Completado' ? 'Pendiente' : 'Completado';

    this.projectService
      .updateProject(this.project._id, { steps: this.project.steps } as any)
      .subscribe({
        next: () => {
          if (
            step.status === 'Completado' &&
            this.activeStepIndex < this.project!.steps.length - 1
          ) {
            setTimeout(() => this.nextStep(), 600);
          }
        },
        error: () => {
          step.status = step.status === 'Completado' ? 'Pendiente' : 'Completado';
          this.toastService.error('Error al actualizar el paso.');
        },
      });
  }

  toggleMaterial(index: number): void {
    if (!this.project) return;
    const mat = this.project.materials[index];
    mat.isAcquired = !mat.isAcquired;

    this.projectService
      .updateProject(this.project._id, { materials: this.project.materials } as any)
      .subscribe({
        error: () => {
          mat.isAcquired = !mat.isAcquired;
          this.toastService.error('Error al actualizar material.');
        },
      });
  }

  /* ==========================================================================
     SISTEMA DE BITÁCORA (Estrategia de Autoguardado)
     ========================================================================== */

  /**
   * Configura la persistencia automática de las notas de aprendizaje utilizando
   * operadores de RxJS para minimizar el impacto en el ancho de banda.
   */
  private setupAutoSave(): void {
    this.notesControl.valueChanges
      .pipe(debounceTime(1000), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((notes) => this.saveLearningNotes(notes || ''));
  }

  private saveLearningNotes(notes: string): void {
    if (!this.project) return;
    this.isSavingNotes = true;
    this.cdr.detectChanges();

    this.projectService.updateProject(this.project._id, { learningNotes: notes }).subscribe({
      next: () => {
        this.isSavingNotes = false;
        this.lastSavedTime = new Date();
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSavingNotes = false;
        this.cdr.detectChanges();
      },
    });
  }

  /* ==========================================================================
     INTEGRACIÓN CON LA COMUNIDAD (Comentarios Públicos)
     ========================================================================== */

  /**
   * Recupera el repositorio de comentarios del proyecto raíz.
   */
  loadComments(): void {
    const targetId = this.project?.originalProjectId || this.project?._id;
    if (!targetId) return;

    this.isLoadingComments = true;
    this.communityService.getProjectComments(targetId, 1, 50).subscribe({
      next: (res) => {
        this.comments = res.data.docs;
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
   * Publica una nueva interacción en la comunidad original del proyecto.
   */
  postComment(): void {
    const targetId = this.project?.originalProjectId || this.project?._id;
    if (!targetId || this.newCommentControl.invalid) return;

    this.isSubmittingComment = true;
    const content = this.newCommentControl.value!;

    this.communityService.addComment(targetId, { content }).subscribe({
      next: () => {
        this.newCommentControl.reset();
        this.isSubmittingComment = false;
        this.loadComments();
        this.toastService.success('Comentario publicado en la comunidad.');
      },
      error: () => {
        this.isSubmittingComment = false;
        this.toastService.error('No se pudo publicar el comentario.');
      },
    });
  }

  /* ==========================================================================
     MÉTODOS AUXILIARES Y ACCESIBILIDAD
     ========================================================================== */

  switchTab(tab: WorkshopTab): void {
    this.activeTab = tab;
    if (tab === 'comunidad') {
      this.loadComments();
    }
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /** Cálculo en tiempo real del porcentaje de cumplimiento del proyecto */
  get progressPercentage(): number {
    if (!this.project?.steps.length) return 0;
    const completed = this.project.steps.filter((s) => s.status === 'Completado').length;
    return (completed / this.project.steps.length) * 100;
  }

  getAuthorName(ownerId: any): string {
    if (ownerId && typeof ownerId === 'object') return ownerId.displayName || 'Anónimo';
    return 'Anónimo';
  }

  /** Gestión de accesibilidad mediante atajos de teclado para la navegación de pasos */
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (this.activeTab === 'pasos') {
      if (event.key === 'ArrowRight') this.nextStep();
      if (event.key === 'ArrowLeft') this.prevStep();
    }
  }
}
