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
import { Subject, forkJoin, of } from 'rxjs';
import { debounceTime, takeUntil, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { ProjectService } from '../../../core/services/project.service';
import { CommunityService } from '../../../core/services/community.service';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { Project } from '../../../shared/models/project.model';
import { Comment } from '../../../shared/models/community.model';

// Definición de las pestañas del taller, incluyendo la pestaña dinámica de comunidad
type WorkshopTab = 'pasos' | 'materiales' | 'bitacora' | 'comunidad';

@Component({
  selector: 'app-project-workshop',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './project-workshop.html',
})
export class ProjectWorkshop implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private communityService = inject(CommunityService);
  private userService = inject(UserService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  // --- ESTADO DEL PROYECTO ACTUAL ---
  project: Project | null = null;
  isLoading = true;
  currentUserId: string | null = null;
  isOwner = false;

  // --- ESTADO DEL PROYECTO ORIGINAL (Para Créditos y Comunidad) ---
  originalProject: Project | null = null;
  comments: Comment[] = [];
  isLoadingComments = false;

  // --- CONTROL DE INTERFAZ ---
  activeTab: WorkshopTab = 'pasos';
  activeStepIndex = 0;

  // --- SISTEMA DE BITÁCORA (Privada) ---
  notesControl = new FormControl('');
  isSavingNotes = false;
  lastSavedTime: Date | null = null;

  // --- SISTEMA DE COMENTARIOS (Públicos) ---
  newCommentControl = new FormControl('', [Validators.required]);
  isSubmittingComment = false;

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
   * Orquestación inicial: Carga el proyecto, el usuario actual y,
   * si es una adaptación, los datos del autor original.
   */
  private initWorkshop(id: string) {
    this.isLoading = true;

    forkJoin({
      projectRes: this.projectService.getProjectById(id),
      userRes: this.userService.getMe(),
    }).subscribe({
      next: ({ projectRes, userRes }) => {
        this.project = projectRes.data;
        this.currentUserId = userRes.data._id;

        // Verificamos si el usuario actual es el dueño del clon
        const ownerId =
          typeof this.project.ownerId === 'string'
            ? this.project.ownerId
            : this.project.ownerId?._id;
        this.isOwner = this.currentUserId === ownerId;

        // Inicializar bitácora
        this.notesControl.setValue(this.project.learningNotes || '', { emitEvent: false });
        this.setupAutoSave();

        // Si es adaptado, cargamos los créditos y comentarios del original
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
   * Carga los datos del proyecto original para mostrar la atribución y los comentarios.
   */
  private loadOriginalData(originalId: string) {
    this.projectService.getProjectById(originalId).subscribe({
      next: (res) => {
        this.originalProject = res.data;
        this.loadComments();
        this.cdr.detectChanges();
      },
    });
  }

  // --- GESTIÓN DE PASOS Y PROGRESO ---

  nextStep() {
    if (this.project && this.activeStepIndex < this.project.steps.length - 1) {
      this.activeStepIndex++;
      this.scrollToTop();
    }
  }

  prevStep() {
    if (this.activeStepIndex > 0) {
      this.activeStepIndex--;
      this.scrollToTop();
    }
  }

  toggleStepStatus(index: number) {
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

  toggleMaterial(index: number) {
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

  // --- SISTEMA DE BITÁCORA (AUTOGUARDADO) ---

  private setupAutoSave() {
    this.notesControl.valueChanges
      .pipe(debounceTime(1000), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((notes) => this.saveLearningNotes(notes || ''));
  }

  private saveLearningNotes(notes: string) {
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

  // --- SISTEMA DE COMUNIDAD (COMENTARIOS PÚBLICOS) ---

  loadComments() {
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

  postComment() {
    const targetId = this.project?.originalProjectId || this.project?._id;
    if (!targetId || this.newCommentControl.invalid) return;

    this.isSubmittingComment = true;
    const content = this.newCommentControl.value!;

    this.communityService.addComment(targetId, { content }).subscribe({
      next: () => {
        this.newCommentControl.reset();
        this.isSubmittingComment = false;
        this.loadComments(); // Recargamos para ver el nuevo comentario
        this.toastService.success('Comentario publicado en la comunidad.');
      },
      error: () => {
        this.isSubmittingComment = false;
        this.toastService.error('No se pudo publicar el comentario.');
      },
    });
  }

  // --- HELPERS ---

  switchTab(tab: WorkshopTab) {
    this.activeTab = tab;
    if (tab === 'comunidad') {
      this.loadComments();
    }
  }

  private scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get progressPercentage(): number {
    if (!this.project?.steps.length) return 0;
    const completed = this.project.steps.filter((s) => s.status === 'Completado').length;
    return (completed / this.project.steps.length) * 100;
  }

  getAuthorName(ownerId: any): string {
    if (ownerId && typeof ownerId === 'object') return ownerId.displayName || 'Anónimo';
    return 'Anónimo';
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (this.activeTab === 'pasos') {
      if (event.key === 'ArrowRight') this.nextStep();
      if (event.key === 'ArrowLeft') this.prevStep();
    }
  }
}
