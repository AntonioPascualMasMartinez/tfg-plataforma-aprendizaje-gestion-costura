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
import { UploadService } from '../../../core/services/upload.service'; // <-- Importar el servicio

@Component({
  selector: 'app-create-tutorial-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './create-tutorial-modal.component.html',
})
export class CreateTutorialModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() isLoading = false;
  @Input() tutorialData: Tutorial | null = null; // <-- 1. Soporte para Edición

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<CreateTutorialPayload>();

  private fb = inject(FormBuilder);
  private uploadService = inject(UploadService);
  private cdr = inject(ChangeDetectorRef);

  tutorialForm!: FormGroup;
  difficulties: DifficultyLevel[] = ['Principiante', 'Intermedio', 'Avanzado'];

  // <-- 2. Estado para el spinner de subida de imágenes (guardará el índice del paso actual)
  uploadingStepIndex: number | null = null;

  ngOnInit() {
    this.initForm();
    if (!this.tutorialData) {
      this.addStep(); // Solo añade el paso vacío inicial si estamos creando de cero
    }
  }

  // --- 1. LÓGICA DE EDICIÓN ---
  // ngOnChanges detecta cuando el @Input() tutorialData o isOpen cambian
  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen) {
      if (this.tutorialData && this.tutorialForm) {
        this.populateForm(this.tutorialData);
      } else if (!this.tutorialData && this.tutorialForm) {
        this.resetFormState();
      }
    }
  }

  private initForm() {
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

  // Rellena el formulario reactivo con los datos del backend
  private populateForm(data: Tutorial) {
    this.materialsNeeded.clear();
    this.steps.clear();

    // Valores básicos
    this.tutorialForm.patchValue({
      title: data.title,
      category: data.category,
      difficultyLevel: data.difficultyLevel,
      estimatedTime: data.estimatedTime,
      description: data.description,
    });

    // Reconstruir Array de Materiales
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

    // Reconstruir Array de Pasos (asegurando el orden)
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

  private resetFormState() {
    this.tutorialForm.reset({
      difficultyLevel: 'Principiante',
      estimatedTime: 60,
    });
    this.materialsNeeded.clear();
    this.steps.clear();
    this.addStep();
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
    this.materialsNeeded.push(
      this.fb.group({
        name: ['', Validators.required],
        quantity: ['', Validators.required],
      }),
    );
    this.tutorialForm.markAsDirty();
  }

  removeMaterial(index: number) {
    this.materialsNeeded.removeAt(index);
    this.tutorialForm.markAsDirty();
  }

  // --- GESTIÓN DE PASOS Y 3. REORDENACIÓN DINÁMICA ---
  addStep() {
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

  removeStep(index: number) {
    this.steps.removeAt(index);
    this.recalculateStepOrders();
    this.tutorialForm.markAsDirty();
  }

  moveStep(index: number, direction: 'up' | 'down') {
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

  private recalculateStepOrders() {
    this.steps.controls.forEach((control, i) => {
      control.get('order')?.setValue(i + 1);
    });
  }

  // --- 2. SUBIDA NATIVA A CLOUDINARY ---
  onFileSelected(event: Event, stepIndex: number) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.uploadingStepIndex = stepIndex;
    this.cdr.detectChanges(); // Forzamos la vista para mostrar el spinner

    this.uploadService.uploadImage(file, 'needly_tutorials').subscribe({
      next: (response: any) => {
        // La API de Cloudinary devuelve la URL final en la propiedad 'secure_url'
        const imageUrl = response.secure_url;
        this.steps.at(stepIndex).get('mediaUrl')?.setValue(imageUrl);

        this.uploadingStepIndex = null;
        this.tutorialForm.markAsDirty();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al subir la imagen:', err);
        this.uploadingStepIndex = null;
        this.cdr.detectChanges();
        alert('Hubo un error al subir la imagen. Por favor, inténtalo de nuevo.');
      },
    });
  }

  removeImage(stepIndex: number) {
    this.steps.at(stepIndex).get('mediaUrl')?.setValue(null);
    this.tutorialForm.markAsDirty();
  }

  // --- 4. ACCIONES DEL MODAL (PREVENCIÓN DE CIERRE) ---
  onSubmit() {
    if (this.tutorialForm.valid) {
      this.save.emit(this.tutorialForm.value as CreateTutorialPayload);
      // Nota: No cerramos el modal aquí. El componente padre es quien
      // cambia isOpen a false cuando el backend responde correctamente.
    } else {
      this.tutorialForm.markAllAsTouched();
    }
  }

  requestClose() {
    // Si el usuario ha tocado algo (dirty) y no estamos en medio de un guardado
    if (this.tutorialForm.dirty && !this.isLoading) {
      const confirm = window.confirm(
        'Tienes cambios sin guardar. ¿Estás seguro de que deseas salir y perder tu progreso?',
      );
      if (!confirm) return; // Si dice "Cancelar", abortamos el cierre
    }
    this.executeClose();
  }

  private executeClose() {
    this.resetFormState();
    this.close.emit();
  }
}
