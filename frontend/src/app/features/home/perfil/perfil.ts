import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { User, SewingLevel, UpdateProfilePayload } from '../../../shared/models/user.model';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './perfil.html',
})
export class Perfil implements OnInit {
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  user: User | null = null;
  profileForm: FormGroup;

  isLoading = true;
  isSaving = false;
  successMessage = '';
  errorMessage = '';

  // Previsualización del avatar seleccionado antes de guardar
  avatarPreview: string | null = null;

  sewingLevels: SewingLevel[] = ['Principiante', 'Intermedio', 'Experto'];

  constructor() {
    this.profileForm = this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(3)]],
      sewingLevel: [null],
      interests: [''],
      avatar: [null], // Añadimos el control para el avatar
    });
  }

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.userService.getMe().subscribe({
      next: (response) => {
        this.user = response.data;
        this.avatarPreview = this.user.avatar; // Establecer avatar actual

        this.profileForm.patchValue({
          displayName: this.user.displayName,
          sewingLevel: this.user.sewingLevel || null,
          interests: this.user.interests ? this.user.interests.join(', ') : '',
          avatar: null, // Mantenemos null hasta que suba uno nuevo
        });

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = 'No se pudieron cargar los datos del perfil.';
        console.error('Error al cargar perfil', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  // Método para manejar la selección de imagen
  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      // Validar tamaño (ej: máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        this.errorMessage = 'La imagen es demasiado grande. Máximo 2MB.';
        this.cdr.detectChanges();
        return;
      }

      this.errorMessage = '';
      const reader = new FileReader();

      reader.onload = () => {
        this.avatarPreview = reader.result as string; // Mostrar previsualización
        this.profileForm.patchValue({ avatar: this.avatarPreview }); // Guardar en el form
        this.profileForm.markAsDirty(); // Marcar formulario como modificado
        this.cdr.detectChanges();
      };

      reader.readAsDataURL(file); // Convertir a Base64
    }
  }

  onSubmit() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.cdr.detectChanges();

    const formValue = this.profileForm.value;
    const interestsArray = formValue.interests
      ? formValue.interests
          .split(',')
          .map((i: string) => i.trim())
          .filter((i: string) => i.length > 0)
      : [];

    const payload: UpdateProfilePayload = {
      displayName: formValue.displayName,
      sewingLevel: formValue.sewingLevel,
      interests: interestsArray,
    };

    // Solo enviamos el avatar si se ha cambiado (si hay algo en el formControl)
    if (formValue.avatar) {
      payload.avatar = formValue.avatar;
    }

    this.userService.updateMe(payload).subscribe({
      next: (response) => {
        this.user = response.data;
        this.profileForm.markAsPristine(); // Limpiamos el estado dirty
        this.successMessage = '¡Tu perfil se ha actualizado correctamente!';
        this.isSaving = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Hubo un error al actualizar tu perfil.';
        this.isSaving = false;
        this.cdr.detectChanges();
      },
      complete: () => {
        setTimeout(() => {
          this.successMessage = '';
          this.cdr.detectChanges();
        }, 4000);
      },
    });
  }
}
