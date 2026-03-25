import { Component, EventEmitter, Input, Output, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { CreateTutorialPayload, DifficultyLevel } from '../../../shared/models/tutorial.model';

@Component({
  selector: 'app-create-tutorial-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './create-tutorial-modal.component.html'
})
export class CreateTutorialModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() isLoading = false;
  
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<CreateTutorialPayload>();

  private fb = inject(FormBuilder);
  tutorialForm!: FormGroup;

  difficulties: DifficultyLevel[] = ['Principiante', 'Intermedio', 'Avanzado'];

  ngOnInit() {
    this.initForm();
    // Añadimos un paso por defecto para que no empiece vacío
    this.addStep();
  }

  private initForm() {
    this.tutorialForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      category: ['', Validators.required],
      difficultyLevel: ['Principiante', Validators.required],
      estimatedTime: [60, [Validators.required, Validators.min(1)]],
      description: ['', Validators.required],
      materialsNeeded: this.fb.array([]),
      steps: this.fb.array([])
    });
  }

  // --- GETTERS PARA LOS ARRAYS ---
  get materialsNeeded(): FormArray {
    return this.tutorialForm.get('materialsNeeded') as FormArray;
  }

  get steps(): FormArray {
    return this.tutorialForm.get('steps') as FormArray;
  }

  // --- GESTIÓN DE MATERIALES ---
  addMaterial() {
    const materialForm = this.fb.group({
      name: ['', Validators.required],
      quantity: ['', Validators.required]
    });
    this.materialsNeeded.push(materialForm);
  }

  removeMaterial(index: number) {
    this.materialsNeeded.removeAt(index);
  }

  // --- GESTIÓN DE PASOS ---
  addStep() {
    const stepOrder = this.steps.length + 1;
    const stepForm = this.fb.group({
      order: [stepOrder, Validators.required],
      title: ['', Validators.required],
      description: ['', Validators.required],
      mediaUrl: [''] // Opcional
    });
    this.steps.push(stepForm);
  }

  removeStep(index: number) {
    this.steps.removeAt(index);
    // Recalcular el orden de los pasos restantes
    this.steps.controls.forEach((control, i) => {
      control.get('order')?.setValue(i + 1);
    });
  }

  // --- ACCIONES DEL MODAL ---
  onSubmit() {
    if (this.tutorialForm.valid) {
      this.save.emit(this.tutorialForm.value as CreateTutorialPayload);
    } else {
      this.tutorialForm.markAllAsTouched();
    }
  }

  onClose() {
    this.tutorialForm.reset();
    this.materialsNeeded.clear();
    this.steps.clear();
    this.initForm();
    this.addStep(); // Restaurar el paso inicial
    this.close.emit();
  }
}