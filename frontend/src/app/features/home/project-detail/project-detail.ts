import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { ProjectService } from '../../../core/services/project.service';
import { UploadService } from '../../../core/services/upload.service';
import { ToastService } from '../../../core/services/toast.service';
import { Project, AddStepPayload, ProjectMaterial } from '../../../shared/models/project.model';

import { ConfirmModalComponent } from '../../../shared/modals/confirm-modal/confirm-modal.component';

type EditorTab = 'pasos' | 'materiales' | 'preview';

@Component({
  selector: 'app-project-detail', // Mantenemos el selector actual por compatibilidad de rutas
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ConfirmModalComponent],
  templateUrl: './project-detail.html',
})
export class ProjectDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private uploadService = inject(UploadService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  // Estado del proyecto
  project: Project | null = null;
  isLoading = true;
  errorMessage = '';

  // Control de interfaz del Editor
  activeTab: EditorTab = 'pasos';

  // Formularios
  stepForm: FormGroup;
  materialForm: FormGroup;

  // Estados de carga y adición
  isAddingStep = false;
  isAddingMaterial = false;
  isUploadingStepImage = false;
  stepImagePreview: string | null = null;

  showDeleteStepModal = false;
  stepToDeleteIndex: number | null = null;
  showDeleteMaterialModal = false;
  materialToDeleteIndex: number | null = null;
  editingStepIndex: number | null = null;

  constructor() {
    this.stepForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      mediaUrl: [null],
    });

    this.materialForm = this.fb.group({
      name: ['', Validators.required],
      quantity: ['', Validators.required],
      notes: [''],
    });
  }

  ngOnInit() {
    const projectId = this.route.snapshot.paramMap.get('id');
    if (projectId) {
      this.loadProject(projectId);
    }
  }

  // --- NAVEGACIÓN DEL EDITOR ---

  switchTab(tab: EditorTab) {
    this.activeTab = tab;
    // Reseteamos los estados de edición al cambiar de pestaña
    this.isAddingStep = false;
    this.isAddingMaterial = false;
  }

  loadProject(id: string) {
    this.isLoading = true;
    this.projectService.getProjectById(id).subscribe({
      next: (res) => {
        this.project = res.data;
        this.isLoading = false;

        // Si el proyecto no tiene pasos, forzamos la pestaña de pasos para que comience a crear
        if (this.project?.steps.length === 0) {
          this.activeTab = 'pasos';
          this.isAddingStep = true;
        }

        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar el proyecto para su edición.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  // --- GESTIÓN DE PASOS ---

  toggleAddStep() {
    this.isAddingStep = !this.isAddingStep;
    if (!this.isAddingStep) {
      this.resetStepForm();
    }
  }

  private resetStepForm() {
    this.stepForm.reset();
    this.stepImagePreview = null;
    this.editingStepIndex = null;
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
        this.toastService.error('Error al subir la imagen del paso.');
        this.isUploadingStepImage = false;
        this.cdr.detectChanges();
      },
    });
  }

  removeStepImage() {
    this.stepImagePreview = null;
    this.stepForm.patchValue({ mediaUrl: null });
  }

  // --- EDICIÓN Y GUARDADO DE PASOS ---
  editStep(index: number) {
    if (!this.project) return;

    this.editingStepIndex = index;
    const step = this.project.steps[index];

    this.stepForm.patchValue({
      title: step.title,
      description: step.description,
      mediaUrl: step.mediaUrl,
    });
    this.stepImagePreview = step.mediaUrl;

    this.isAddingStep = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onSaveStep() {
    // Reemplaza a onAddStep
    if (this.stepForm.invalid || !this.project) return;

    const stepData = this.stepForm.value;

    if (this.editingStepIndex !== null) {
      // Modo Edición: Actualizamos el paso en el array
      const updatedSteps = [...this.project.steps];
      updatedSteps[this.editingStepIndex] = { ...updatedSteps[this.editingStepIndex], ...stepData };

      this.projectService
        .updateProject(this.project._id, { steps: updatedSteps } as any)
        .subscribe({
          next: (res) => {
            this.project = res.data;
            this.toggleAddStep();
            this.toastService.success('Paso actualizado correctamente.');
            this.cdr.detectChanges();
          },
          error: () => this.toastService.error('Error al actualizar el paso.'),
        });
    } else {
      // Modo Creación: Añadimos uno nuevo
      const payload: AddStepPayload = { ...stepData, status: 'Pendiente' };
      this.projectService.addStepToProject(this.project._id, payload).subscribe({
        next: (res) => {
          this.project = res.data;
          this.toggleAddStep();
          this.toastService.success('Paso añadido correctamente.');
          this.cdr.detectChanges();
        },
        error: () => this.toastService.error('Error al guardar el paso.'),
      });
    }
  }

  // --- ELIMINACIÓN SEGURA DE PASOS ---
  requestDeleteStep(index: number) {
    this.stepToDeleteIndex = index;
    this.showDeleteStepModal = true;
  }

  confirmDeleteStep() {
    if (!this.project || this.stepToDeleteIndex === null) return;
    const updatedSteps = this.project.steps.filter((_, i) => i !== this.stepToDeleteIndex);

    this.projectService.updateProject(this.project._id, { steps: updatedSteps } as any).subscribe({
      next: (res) => {
        this.project = res.data;
        this.toastService.success('Paso eliminado del flujo.');
        this.showDeleteStepModal = false;
        this.stepToDeleteIndex = null;
        this.cdr.detectChanges();
      },
      error: () => this.toastService.error('Hubo un problema al eliminar el paso.'),
    });
  }

  cancelDeleteStep() {
    this.showDeleteStepModal = false;
    this.stepToDeleteIndex = null;
  }

  // --- GESTIÓN DE MATERIALES ---

  toggleAddMaterial() {
    this.isAddingMaterial = !this.isAddingMaterial;
    if (!this.isAddingMaterial) {
      this.materialForm.reset();
    }
  }

  onAddMaterial() {
    if (this.materialForm.invalid || !this.project) return;

    const newMaterial: ProjectMaterial = {
      ...this.materialForm.value,
      isAcquired: false, // Por defecto al crear la plantilla
    };

    const updatedMaterials = [...this.project.materials, newMaterial];

    this.projectService
      .updateProject(this.project._id, { materials: updatedMaterials } as any)
      .subscribe({
        next: (res) => {
          this.project = res.data;
          this.toggleAddMaterial();
          this.toastService.success('Material añadido a la lista.');
          this.cdr.detectChanges();
        },
        error: () => {
          this.toastService.error('Error al guardar el material.');
        },
      });
  }

  // --- ELIMINACIÓN SEGURA DE MATERIALES ---
  requestDeleteMaterial(index: number) {
    this.materialToDeleteIndex = index;
    this.showDeleteMaterialModal = true;
  }

  confirmDeleteMaterial() {
    if (!this.project || this.materialToDeleteIndex === null) return;
    const updatedMaterials = this.project.materials.filter(
      (_, i) => i !== this.materialToDeleteIndex,
    );

    this.projectService
      .updateProject(this.project._id, { materials: updatedMaterials } as any)
      .subscribe({
        next: (res) => {
          this.project = res.data;
          this.toastService.success('Material eliminado.');
          this.showDeleteMaterialModal = false;
          this.materialToDeleteIndex = null;
          this.cdr.detectChanges();
        },
        error: () => this.toastService.error('Hubo un problema al eliminar el material.'),
      });
  }

  cancelDeleteMaterial() {
    this.showDeleteMaterialModal = false;
    this.materialToDeleteIndex = null;
  }
}
