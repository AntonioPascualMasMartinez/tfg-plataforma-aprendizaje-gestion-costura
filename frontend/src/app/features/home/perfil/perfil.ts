import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core'; // <-- Importar
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
  private cdr = inject(ChangeDetectorRef); // <-- Inyectar

  user: User | null = null;
  profileForm: FormGroup;

  isLoading = true;
  isSaving = false;
  successMessage = '';
  errorMessage = '';

  sewingLevels: SewingLevel[] = ['Principiante', 'Intermedio', 'Experto'];

  constructor() {
    this.profileForm = this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(3)]],
      sewingLevel: [null],
      interests: [''],
    });
  }

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    this.isLoading = true;
    this.userService.getMe().subscribe({
      next: (response) => {
        this.user = response.data;

        this.profileForm.patchValue({
          displayName: this.user.displayName,
          sewingLevel: this.user.sewingLevel || null,
          interests: this.user.interests ? this.user.interests.join(', ') : '',
        });

        this.isLoading = false; // <-- Cambiado de sitio
        this.cdr.detectChanges(); // <-- Forzar actualización de vista
      },
      error: (err) => {
        this.errorMessage = 'No se pudieron cargar los datos del perfil.';
        console.error('Error al cargar perfil', err);

        this.isLoading = false; // <-- Cambiado de sitio
        this.cdr.detectChanges();
      },
    });
  }
  // En perfil.ts

  onSubmit() {
    if (this.profileForm.invalid) return;

    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.cdr.detectChanges(); // Asegura que el botón cambie a "Guardando..." inmediatamente

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

    this.userService.updateMe(payload).subscribe({
      next: (response) => {
        this.user = response.data;
        this.successMessage = '¡Tu perfil se ha actualizado correctamente!';
        this.isSaving = false; // Detener estado de guardado
        this.cdr.detectChanges(); // <--- IMPORTANTE: Forzar actualización de la vista
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Hubo un error al actualizar tu perfil.';
        this.isSaving = false; // Detener estado de guardado
        this.cdr.detectChanges(); // <--- IMPORTANTE: Forzar actualización de la vista
      },
      complete: () => {
        // Ocultamos el mensaje de éxito después de 3 segundos
        setTimeout(() => {
          this.successMessage = '';
          this.cdr.detectChanges(); // Forzar limpieza del mensaje
        }, 3000);
      },
    });
  }
}
