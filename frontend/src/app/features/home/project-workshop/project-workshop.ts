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
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil, distinctUntilChanged } from 'rxjs/operators';

import { ProjectService } from '../../../core/services/project.service';
import { ToastService } from '../../../core/services/toast.service';
import { Project } from '../../../shared/models/project.model';

import { UserService } from '../../../core/services/user.service';

type WorkshopTab = 'pasos' | 'materiales' | 'bitacora';

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
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private userService = inject(UserService);
  currentUserId: string | null = null;

  // Estado del proyecto
  project: Project | null = null;
  isLoading = true;
  errorMessage = '';

  // Control de interfaz (Mobile First)
  activeTab: WorkshopTab = 'pasos';
  activeStepIndex = 0;

  // Sistema de Bitácora (Autoguardado)
  notesControl = new FormControl('');
  isSavingNotes = false;
  lastSavedTime: Date | null = null;
  private destroy$ = new Subject<void>();

  ngOnInit() {
    const projectId = this.route.snapshot.paramMap.get('id');
    if (projectId) {
      this.loadProject(projectId);
      this.setupAutoSave();

      // Obtenemos el usuario actual para la validación de propiedad
      this.userService.getMe().subscribe({
        next: (res) => (this.currentUserId = res.data._id),
      });
    } else {
      this.router.navigate(['/home/proyectos']);
    }
  }

  get isOwner(): boolean {
    if (!this.project || !this.currentUserId) return false;
    // Manejamos si el ownerId está populado (objeto) o es solo el string
    const ownerId =
      typeof this.project.ownerId === 'string' ? this.project.ownerId : this.project.ownerId._id;
    return this.currentUserId === ownerId;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Permite navegación por teclado (útil si se usa en tablet/PC)
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (this.activeTab === 'pasos') {
      if (event.key === 'ArrowRight') this.nextStep();
      if (event.key === 'ArrowLeft') this.prevStep();
    }
  }

  // --- CARGA Y CONFIGURACIÓN ---

  loadProject(id: string) {
    this.isLoading = true;
    this.projectService.getProjectById(id).subscribe({
      next: (res) => {
        this.project = res.data;
        this.isLoading = false;

        // Inicializar la bitácora con las notas existentes
        if (this.project.learningNotes) {
          this.notesControl.setValue(this.project.learningNotes, { emitEvent: false });
        }

        // Inteligencia de UX: Si no tiene pasos, llevarlo a materiales
        if (this.project.steps.length === 0) {
          this.activeTab = 'materiales';
        }

        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar el taller del proyecto.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private setupAutoSave() {
    // Escucha cambios en el textarea y guarda automáticamente tras 1 segundo sin escribir
    this.notesControl.valueChanges
      .pipe(debounceTime(1000), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((notes) => {
        if (this.project) {
          this.saveNotes(notes || '');
        }
      });
  }

  // --- NAVEGACIÓN MOBILE ---

  switchTab(tab: WorkshopTab) {
    this.activeTab = tab;
  }

  nextStep() {
    if (this.project && this.activeStepIndex < this.project.steps.length - 1) {
      this.activeStepIndex++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevStep() {
    if (this.activeStepIndex > 0) {
      this.activeStepIndex--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // --- LÓGICA DE PROGRESO Y SEGUIMIENTO ---

  get completedStepsCount(): number {
    if (!this.project || !this.project.steps) return 0;
    return this.project.steps.filter((step) => step.status === 'Completado').length;
  }

  get progressPercentage(): number {
    if (!this.project || !this.project.steps || this.project.steps.length === 0) return 0;
    return (this.completedStepsCount / this.project.steps.length) * 100;
  }

  get acquiredMaterialsCount(): number {
    if (!this.project || !this.project.materials) return 0;
    return this.project.materials.filter((mat) => mat.isAcquired).length;
  }

  // Marcar material como comprado/obtenido
  toggleMaterial(index: number) {
    if (!this.project) return;

    const material = this.project.materials[index];
    material.isAcquired = !material.isAcquired;

    this.projectService
      .updateProject(this.project._id, { materials: this.project.materials } as any)
      .subscribe({
        error: () => {
          // Revertir en caso de error
          material.isAcquired = !material.isAcquired;
          this.toastService.error('Error al sincronizar el material.');
          this.cdr.detectChanges();
        },
      });
  }

  // Marcar paso como completado/pendiente
  toggleStepStatus(index: number) {
    if (!this.project) return;

    const step = this.project.steps[index];
    step.status = step.status === 'Completado' ? 'Pendiente' : 'Completado';

    this.projectService
      .updateProject(this.project._id, { steps: this.project.steps } as any)
      .subscribe({
        next: () => {
          // Avanzar automáticamente al siguiente paso si se marca como completado
          if (
            step.status === 'Completado' &&
            this.activeStepIndex < this.project!.steps.length - 1
          ) {
            // Un pequeño retraso para que el usuario vea la animación de completado
            setTimeout(() => this.nextStep(), 600);
          }
        },
        error: () => {
          step.status = step.status === 'Completado' ? 'Pendiente' : 'Completado';
          this.toastService.error('Error al sincronizar el paso.');
          this.cdr.detectChanges();
        },
      });
  }

  // Autoguardado de notas (Bitácora)
  private saveNotes(notes: string) {
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
        this.toastService.error('Error al guardar tus notas en la bitácora.');
        this.cdr.detectChanges();
      },
    });
  }
}
