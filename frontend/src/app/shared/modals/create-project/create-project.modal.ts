import { Component, EventEmitter, Output, inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service';
import { CreateProjectPayload, Project } from '../../models/project.model';

@Component({
  selector: 'app-create-project-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './create-project.modal.html',
})
export class CreateProjectModal {
  @Output() close = new EventEmitter<void>();
  @Output() projectCreated = new EventEmitter<Project>();

  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private cdr = inject(ChangeDetectorRef);

  isLoading = false;
  errorMessage = '';

  projectForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    description: [''],
    status: ['Planificado'],
    isPublic: [true],
    materials: this.fb.array([]), // Array dinámico para materiales
  });

  // Getter para acceder fácilmente al FormArray en el HTML
  get materials() {
    return this.projectForm.get('materials') as FormArray;
  }

  // Añadir un nuevo material al formulario
  addMaterial() {
    const materialForm = this.fb.group({
      name: ['', Validators.required],
      quantity: ['', Validators.required],
    });
    this.materials.push(materialForm);
  }

  // Eliminar un material por su índice
  removeMaterial(index: number) {
    this.materials.removeAt(index);
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
    this.cdr.detectChanges(); // Forzamos actualización visual

    const payload: CreateProjectPayload = this.projectForm.value;

    this.projectService.createProject(payload).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        // Emitimos el proyecto creado al componente padre y cerramos
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
