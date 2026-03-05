import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service';
import { UploadService } from '../../../core/services/upload.service';
import { Project, AddStepPayload } from '../../../shared/models/project.model';

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

  // Control de Modos y Pestañas
  viewMode: ViewMode = 'taller';
  tallerTab: TallerTab = 'pasos'; // Pestaña activa en el modo taller
  activeStepIndex = 0; // Índice del paso actual en el carrusel

  // Formulario para añadir paso
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

  loadProject(id: string) {
    this.isLoading = true;
    this.projectService.getProjectById(id).subscribe({
      next: (res) => {
        this.project = res.data;
        this.isLoading = false;
        // Si no hay pasos al cargar, enviamos al usuario a la pestaña de materiales por defecto
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

  // Lógica del Carrusel de Pasos
  get progressPercentage(): number {
    if (!this.project || !this.project.steps || this.project.steps.length === 0) return 0;
    return ((this.activeStepIndex + 1) / this.project.steps.length) * 100;
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

  // Lógica de Edición
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

    const payload: AddStepPayload = this.stepForm.value;

    this.projectService.addStepToProject(this.project._id, payload).subscribe({
      next: (res) => {
        this.project = res.data;
        this.toggleAddStep();
        // Navegamos automáticamente al nuevo paso si estamos en modo taller
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
