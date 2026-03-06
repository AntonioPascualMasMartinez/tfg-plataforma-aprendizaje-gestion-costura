import { Component, EventEmitter, Output, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service';
import { UploadService } from '../../../core/services/upload.service';
import { CreateProjectPayload, Project } from '../../models/project.model';
import { NgClass } from '@angular/common'; // Asegúrate de importar NgClass

@Component({
  selector: 'app-create-project-modal',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass], // Añadido NgClass
  templateUrl: './create-project.modal.html',
})
export class CreateProjectModal implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() projectCreated = new EventEmitter<Project>();

  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private uploadService = inject(UploadService);
  private cdr = inject(ChangeDetectorRef);

  isLoading = false;
  errorMessage = '';

  isUploadingImage = false;
  imagePreview: string | null = null;

  currentStep = 1;
  totalSteps = 2;

  // Opciones predefinidas
  readonly categories = ['Bolsos', 'Carteras', 'Monederos'];
  readonly difficulties = ['Fácil', 'Intermedio', 'Avanzado'];
  readonly statuses = ['Planificado', 'En curso', 'Pausado'];

  projectForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    projectType: ['Nuevo', [Validators.required]], // Por defecto 'Nuevo'
    category: ['', [Validators.required]],
    difficulty: ['', [Validators.required]],
    inspirationImageUrl: [null],
    description: [''],
    status: ['Planificado'], // Por defecto 'Planificado'
    isPublic: [true],
    materials: this.fb.array([]),
  });

  ngOnInit() {}

  // --- NUEVO: Helper para actualizar controles desde la UI personalizada ---
  setControlValue(controlName: string, value: string) {
    const control = this.projectForm.get(controlName);
    if (control) {
      control.setValue(value);
      control.markAsTouched();
    }
  }

  get materials() {
    return this.projectForm.get('materials') as FormArray;
  }

  addMaterial() {
    const materialForm = this.fb.group({
      name: ['', Validators.required],
      quantity: ['', Validators.required],
    });
    this.materials.push(materialForm);
  }

  removeMaterial(index: number) {
    this.materials.removeAt(index);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.isUploadingImage = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.uploadService.uploadImage(file).subscribe({
      next: (cloudinaryResponse) => {
        this.imagePreview = cloudinaryResponse.secure_url;
        this.projectForm.patchValue({ inspirationImageUrl: cloudinaryResponse.secure_url });
        this.isUploadingImage = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Error al subir la imagen a Cloudinary.';
        this.isUploadingImage = false;
        this.cdr.detectChanges();
      },
    });
  }

  removeImage() {
    this.imagePreview = null;
    this.projectForm.patchValue({ inspirationImageUrl: null });
  }

  nextStep() {
    const step1Controls = ['title', 'projectType', 'category', 'difficulty', 'status', 'isPublic'];
    let isStep1Valid = true;

    step1Controls.forEach((controlName) => {
      const control = this.projectForm.get(controlName);
      if (control?.invalid) {
        control.markAsTouched();
        isStep1Valid = false;
      }
    });

    if (isStep1Valid && this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  closeModal() {
    this.close.emit();
  }

  onSubmit() {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    const payload: CreateProjectPayload = this.projectForm.value;

    this.projectService.createProject(payload).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.projectCreated.emit(response.data);
        this.closeModal();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Error al crear el proyecto. Intenta de nuevo.';
        this.cdr.detectChanges();
      },
    });
  }
}
