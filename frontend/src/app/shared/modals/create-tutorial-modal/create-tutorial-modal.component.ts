/**
 * @file create-tutorial-modal.component.ts
 * @description Componente de interfaz modal complejo para la autoría y edición de unidades didácticas (Tutoriales).
 * Permite tanto la inserción inicial como la mutación del registro gracias al ciclo de vida OnChanges.
 * Emplea FormArrays anidados para la organización de materiales y pasos secuenciales, integrando
 * capacidades de reordenamiento de nodos (Drag & Drop lógico).
 */
import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  OnInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  CreateTutorialPayload,
  DifficultyLevel,
  Tutorial,
} from '../../../shared/models/tutorial.model';
import { UploadService } from '../../../core/services/upload.service';

@Component({
  selector: 'app-create-tutorial-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './create-tutorial-modal.component.html',
})
export class CreateTutorialModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() isLoading = false;

  /** Identificador de edición. Si se proporciona, el modal opera en modo "Actualización". */
  @Input() tutorialData: Tutorial | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<CreateTutorialPayload>();

  private fb = inject(FormBuilder);
  private uploadService = inject(UploadService);
  private cdr = inject(ChangeDetectorRef);

  tutorialForm!: FormGroup;
  difficulties: DifficultyLevel[] = ['Principiante', 'Intermedio', 'Avanzado'];

  /** Puntero al índice del paso (Step) cuya imagen se encuentra en tránsito. */
  uploadingStepIndex: number | null = null;

  ngOnInit(): void {
    this.initForm();
    if (!this.tutorialData) {
      this.addStep();
    }
  }

  /**
   * Monitoriza modificaciones externas en los parámetros de entrada (Inputs).
   * Responsable de instanciar el modo edición poblado el formulario si se detecta un objeto `tutorialData`.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      if (this.tutorialData && this.tutorialForm) {
        this.populateForm(this.tutorialData);
      } else if (!this.tutorialData && this.tutorialForm) {
        this.resetFormState();
      }
    }
  }

  /**
   * Construcción de la jerarquía base del modelo de formulario (ReactiveForms).
   */
  private initForm(): void {
    this.tutorialForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      category: ['', Validators.required],
      difficultyLevel: ['Principiante', Validators.required],
      estimatedTime: [60, [Validators.required, Validators.min(1)]],
      description: ['', Validators.required],
      materialsNeeded: this.fb.array([]),
      steps: this.fb.array([]),
    });
  }

  /**
   * Sincroniza la estructura de datos entrante (Backend) con el árbol de controles reactivos (Frontend).
   * @param {Tutorial} data - Entidad con datos consolidados.
   */
  private populateForm(data: Tutorial): void {
    this.materialsNeeded.clear();
    this.steps.clear();

    this.tutorialForm.patchValue({
      title: data.title,
      category: data.category,
      difficultyLevel: data.difficultyLevel,
      estimatedTime: data.estimatedTime,
      description: data.description,
    });

    /* Reconstrucción iterativa de sub-arreglos */
    if (data.materialsNeeded && data.materialsNeeded.length > 0) {
      data.materialsNeeded.forEach((mat) => {
        this.materialsNeeded.push(
          this.fb.group({
            name: [mat.name, Validators.required],
            quantity: [mat.quantity, Validators.required],
          }),
        );
      });
    }

    if (data.steps && data.steps.length > 0) {
      const sortedSteps = [...data.steps].sort((a, b) => a.order - b.order);
      sortedSteps.forEach((step) => {
        this.steps.push(
          this.fb.group({
            order: [step.order, Validators.required],
            title: [step.title, Validators.required],
            description: [step.description, Validators.required],
            mediaUrl: [step.mediaUrl],
          }),
        );
      });
    }
  }

  private resetFormState(): void {
    this.tutorialForm.reset({
      difficultyLevel: 'Principiante',
      estimatedTime: 60,
    });
    this.materialsNeeded.clear();
    this.steps.clear();
    this.addStep();
  }

  get materialsNeeded(): FormArray {
    return this.tutorialForm.get('materialsNeeded') as FormArray;
  }

  get steps(): FormArray {
    return this.tutorialForm.get('steps') as FormArray;
  }

  addMaterial(): void {
    this.materialsNeeded.push(
      this.fb.group({
        name: ['', Validators.required],
        quantity: ['', Validators.required],
      }),
    );
    this.tutorialForm.markAsDirty();
  }

  removeMaterial(index: number): void {
    this.materialsNeeded.removeAt(index);
    this.tutorialForm.markAsDirty();
  }

  addStep(): void {
    const stepOrder = this.steps.length + 1;
    this.steps.push(
      this.fb.group({
        order: [stepOrder, Validators.required],
        title: ['', Validators.required],
        description: ['', Validators.required],
        mediaUrl: [''],
      }),
    );
    this.tutorialForm.markAsDirty();
  }

  removeStep(index: number): void {
    this.steps.removeAt(index);
    this.recalculateStepOrders();
    this.tutorialForm.markAsDirty();
  }

  /**
   * Gestión de reubicación espacial de pasos formativos alterando el índice dentro del `FormArray`.
   * Invoca un recalculo lógico del atributo persistido `order`.
   * @param {number} index - Índice temporal actual.
   * @param {'up' | 'down'} direction - Sentido de desplazamiento.
   */
  moveStep(index: number, direction: 'up' | 'down'): void {
    if (direction === 'up' && index > 0) {
      const current = this.steps.at(index);
      this.steps.removeAt(index);
      this.steps.insert(index - 1, current);
    } else if (direction === 'down' && index < this.steps.length - 1) {
      const current = this.steps.at(index);
      this.steps.removeAt(index);
      this.steps.insert(index + 1, current);
    }
    this.recalculateStepOrders();
    this.tutorialForm.markAsDirty();
  }

  private recalculateStepOrders(): void {
    this.steps.controls.forEach((control, i) => {
      control.get('order')?.setValue(i + 1);
    });
  }

  onFileSelected(event: Event, stepIndex: number): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.uploadingStepIndex = stepIndex;
    this.cdr.detectChanges();

    this.uploadService.uploadImage(file, 'needly_tutorials').subscribe({
      next: (response: any) => {
        const imageUrl = response.secure_url;
        this.steps.at(stepIndex).get('mediaUrl')?.setValue(imageUrl);

        this.uploadingStepIndex = null;
        this.tutorialForm.markAsDirty();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error durante la transmisión binaria de imagen:', err);
        this.uploadingStepIndex = null;
        this.cdr.detectChanges();
        alert('Hubo un error al subir la imagen. Por favor, inténtalo de nuevo.');
      },
    });
  }

  removeImage(stepIndex: number): void {
    this.steps.at(stepIndex).get('mediaUrl')?.setValue(null);
    this.tutorialForm.markAsDirty();
  }

  onSubmit(): void {
    if (this.tutorialForm.valid) {
      this.save.emit(this.tutorialForm.value as CreateTutorialPayload);
    } else {
      this.tutorialForm.markAllAsTouched();
    }
  }

  /**
   * Previene la pérdida accidental de datos en progreso ante un cierre prematuro del modal.
   */
  requestClose(): void {
    if (this.tutorialForm.dirty && !this.isLoading) {
      const confirm = window.confirm(
        'Tienes cambios sin guardar. ¿Estás seguro de que deseas salir y perder tu progreso?',
      );
      if (!confirm) return;
    }
    this.executeClose();
  }

  private executeClose(): void {
    this.resetFormState();
    this.close.emit();
  }
}
