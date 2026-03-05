import { Component, EventEmitter, Output, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service';
import { CreateProjectPayload, Project } from '../../models/project.model';

@Component({
  selector: 'app-create-project-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './create-project.modal.html',
})
export class CreateProjectModal implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() projectCreated = new EventEmitter<Project>();

  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private cdr = inject(ChangeDetectorRef);

  isLoading = false;
  errorMessage = '';

  // Nuevo: Control del wizard
  currentStep = 1;
  totalSteps = 2;

  projectForm: FormGroup = this.fb.group({
    // Paso 1: Detalles básicos
    title: ['', [Validators.required, Validators.maxLength(100)]],
    description: [''],
    status: ['Planificado'],
    isPublic: [true],
    // Paso 2: Materiales
    materials: this.fb.array([]),
  });

  ngOnInit() {
    // Inicializar con un material vacío por defecto si lo deseas
    // this.addMaterial();
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

  // Navegación del Wizard
  nextStep() {
    // Validar solo los campos del primer paso antes de avanzar
    const step1Controls = ['title', 'status', 'isPublic'];
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
