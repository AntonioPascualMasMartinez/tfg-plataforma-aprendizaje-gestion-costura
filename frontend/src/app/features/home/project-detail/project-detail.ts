/**
 * @file project-detail.ts
 * @description Componente controlador para el editor detallado de proyectos.
 * Gestiona la configuración modular de pasos instructivos y listas de materiales,
 * permitiendo una edición granular y previsualización en tiempo real.
 * Implementa una interfaz de pestañas para la segmentación de la lógica de negocio.
 */
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { ProjectService } from '../../../core/services/project.service';
import { UploadService } from '../../../core/services/upload.service';
import { ToastService } from '../../../core/services/toast.service';
import { Project, AddStepPayload, ProjectMaterial } from '../../../shared/models/project.model';

import { ConfirmModalComponent } from '../../../shared/modals/confirm-modal/confirm-modal.component';

/** Definición de tipos para la navegación interna del editor */
type EditorTab = 'pasos' | 'materiales' | 'preview';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ConfirmModalComponent],
  templateUrl: './project-detail.html',
})
export class ProjectDetail implements OnInit {
  /* Inyección de servicios para la gestión de datos, rutas y feedback */
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private uploadService = inject(UploadService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  /** Entidad del proyecto actual en edición */
  project: Project | null = null;
  /** Estado de carga asíncrona de los datos iniciales */
  isLoading = true;
  errorMessage = '';

  /** Pestaña activa en la interfaz del editor */
  activeTab: EditorTab = 'pasos';

  /** Formulario reactivo para la creación y edición de pasos */
  stepForm: FormGroup;
  /** Formulario reactivo para la definición de materiales requeridos */
  materialForm: FormGroup;

  /* Estados de control para operaciones de inserción y carga de archivos */
  isAddingStep = false;
  isAddingMaterial = false;
  isUploadingStepImage = false;
  stepImagePreview: string | null = null;

  /* Control de ventanas modales para operaciones destructivas */
  showDeleteStepModal = false;
  stepToDeleteIndex: number | null = null;
  showDeleteMaterialModal = false;
  materialToDeleteIndex: number | null = null;

  /** Índice de referencia cuando se activa el modo edición en un paso existente */
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

  /**
   * Gestiona el cambio de contexto en el editor, reseteando los estados de inserción.
   * @param tab Identificador de la pestaña de destino.
   */
  switchTab(tab: EditorTab): void {
    this.activeTab = tab;
    this.isAddingStep = false;
    this.isAddingMaterial = false;
  }

  /**
   * Recupera el estado persistente del proyecto desde el servidor.
   * @param id Identificador único del proyecto.
   */
  loadProject(id: string): void {
    this.isLoading = true;
    this.projectService.getProjectById(id).subscribe({
      next: (res) => {
        this.project = res.data;
        this.isLoading = false;

        // Comportamiento por defecto: forzar creación si el proyecto está vacío
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

  /* ==========================================================================
     LÓGICA DE GESTIÓN DE PASOS (Workflow Instructivo)
     ========================================================================== */

  toggleAddStep(): void {
    this.isAddingStep = !this.isAddingStep;
    if (!this.isAddingStep) {
      this.resetStepForm();
    }
  }

  private resetStepForm(): void {
    this.stepForm.reset();
    this.stepImagePreview = null;
    this.editingStepIndex = null;
  }

  /**
   * Procesa la carga de recursos gráficos vinculados a un paso específico.
   * Delega la transferencia al servicio de almacenamiento Cloudinary.
   */
  onStepImageSelected(event: Event): void {
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

  removeStepImage(): void {
    this.stepImagePreview = null;
    this.stepForm.patchValue({ mediaUrl: null });
  }

  /**
   * Carga los datos de un paso en el formulario para su modificación.
   * @param index Posición del paso en el array de la entidad.
   */
  editStep(index: number): void {
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

  /**
   * Orquesta la persistencia del paso, diferenciando entre la creación
   * de una nueva entrada o la actualización de una existente.
   */
  onSaveStep(): void {
    if (this.stepForm.invalid || !this.project) return;

    const stepData = this.stepForm.value;

    if (this.editingStepIndex !== null) {
      // Flujo de actualización: Reemplazo inmutable en el array de pasos
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
      // Flujo de creación: Inserción al final de la secuencia
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

  requestDeleteStep(index: number): void {
    this.stepToDeleteIndex = index;
    this.showDeleteStepModal = true;
  }

  confirmDeleteStep(): void {
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

  cancelDeleteStep(): void {
    this.showDeleteStepModal = false;
    this.stepToDeleteIndex = null;
  }

  /* ==========================================================================
     LÓGICA DE GESTIÓN DE MATERIALES
     ========================================================================== */

  toggleAddMaterial(): void {
    this.isAddingMaterial = !this.isAddingMaterial;
    if (!this.isAddingMaterial) {
      this.materialForm.reset();
    }
  }

  /**
   * Agrega un nuevo material a la lista del proyecto actualizando la colección inmutablemente.
   */
  onAddMaterial(): void {
    if (this.materialForm.invalid || !this.project) return;

    const newMaterial: ProjectMaterial = {
      ...this.materialForm.value,
      isAcquired: false,
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

  requestDeleteMaterial(index: number): void {
    this.materialToDeleteIndex = index;
    this.showDeleteMaterialModal = true;
  }

  confirmDeleteMaterial(): void {
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

  cancelDeleteMaterial(): void {
    this.showDeleteMaterialModal = false;
    this.materialToDeleteIndex = null;
  }
}
