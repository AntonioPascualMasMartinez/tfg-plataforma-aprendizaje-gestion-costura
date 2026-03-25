import { Component, OnInit, inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service';
import { UploadService } from '../../../core/services/upload.service';
import {
  Project,
  AddStepPayload,
  UpdateProjectPayload,
} from '../../../shared/models/project.model';

type ViewMode = 'taller' | 'edicion';
type TallerTab = 'materiales' | 'pasos';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './project-detail.html',
})
export class ProjectDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private uploadService = inject(UploadService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  project: Project | null = null;
  isLoading = true;
  errorMessage = '';

  viewMode: ViewMode = 'taller';
  tallerTab: TallerTab = 'pasos';
  activeStepIndex = 0;

  stepForm: FormGroup;
  isAddingStep = false;
  isUploadingStepImage = false;
  stepImagePreview: string | null = null;

  constructor() {
    this.stepForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      mediaUrl: [null],
    });
  }

  ngOnInit() {
    const projectId = this.route.snapshot.paramMap.get('id');
    if (projectId) {
      this.loadProject(projectId);
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (this.viewMode === 'taller' && this.tallerTab === 'pasos') {
      if (event.key === 'ArrowRight') {
        this.nextStep();
      } else if (event.key === 'ArrowLeft') {
        this.prevStep();
      }
    }
  }

  loadProject(id: string) {
    this.isLoading = true;
    this.projectService.getProjectById(id).subscribe({
      next: (res) => {
        this.project = res.data;
        this.isLoading = false;
        if (this.project?.steps.length === 0) {
          this.tallerTab = 'materiales';
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar el proyecto.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  setMode(mode: ViewMode) {
    this.viewMode = mode;
  }

  setTallerTab(tab: TallerTab) {
    this.tallerTab = tab;
  }

  // NUEVO: Calculamos cuántos pasos están completados
  get completedStepsCount(): number {
    if (!this.project || !this.project.steps) return 0;
    return this.project.steps.filter((step) => step.status === 'Completado').length;
  }

  // ACTUALIZADO: El progreso ahora se basa en el estado real de los pasos
  get progressPercentage(): number {
    if (!this.project || !this.project.steps || this.project.steps.length === 0) return 0;
    return (this.completedStepsCount / this.project.steps.length) * 100;
  }

  nextStep() {
    if (this.project && this.activeStepIndex < this.project.steps.length - 1) {
      this.activeStepIndex++;
    }
  }

  prevStep() {
    if (this.activeStepIndex > 0) {
      this.activeStepIndex--;
    }
  }

  // NUEVO: Método para alternar el estado de un material y guardarlo
  toggleMaterial(index: number) {
    if (!this.project) return;

    const material = this.project.materials[index];
    material.isAcquired = !material.isAcquired;

    // Hacemos cast a 'any' para eludir la restricción de Omit en UpdateProjectPayload
    // y permitir enviar el array completo con _id e isAcquired
    this.projectService
      .updateProject(this.project._id, { materials: this.project.materials } as any)
      .subscribe({
        error: (err) => console.error('Error al actualizar material', err),
      });
  }

  // NUEVO: Método para alternar el estado de un paso y guardarlo
  toggleStepStatus(index: number) {
    if (!this.project) return;

    const step = this.project.steps[index];
    step.status = step.status === 'Completado' ? 'Pendiente' : 'Completado';

    this.projectService
      .updateProject(this.project._id, { steps: this.project.steps } as any)
      .subscribe({
        error: (err) => console.error('Error al actualizar paso', err),
      });
  }

  toggleAddStep() {
    this.isAddingStep = !this.isAddingStep;
    if (!this.isAddingStep) {
      this.stepForm.reset();
      this.stepImagePreview = null;
    }
  }

  onStepImageSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.isUploadingStepImage = true;
    this.cdr.detectChanges();

    this.uploadService.uploadImage(file, 'costura_steps').subscribe({
      next: (res) => {
        this.stepImagePreview = res.secure_url;
        this.stepForm.patchValue({ mediaUrl: res.secure_url });
        this.isUploadingStepImage = false;
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Error al subir la imagen.');
        this.isUploadingStepImage = false;
        this.cdr.detectChanges();
      },
    });
  }

  removeStepImage() {
    this.stepImagePreview = null;
    this.stepForm.patchValue({ mediaUrl: null });
  }

  onAddStep() {
    if (this.stepForm.invalid || !this.project) return;

    // ACTUALIZADO: Añadimos el status por defecto al crear
    const payload: AddStepPayload = {
      ...this.stepForm.value,
      status: 'Pendiente',
    };

    this.projectService.addStepToProject(this.project._id, payload).subscribe({
      next: (res) => {
        this.project = res.data;
        this.toggleAddStep();
        this.activeStepIndex = this.project!.steps.length - 1;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        alert('Error al guardar el paso.');
      },
    });
  }
}
