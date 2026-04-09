/**
 * @file perfil.ts
 * @description Componente para la gestión integral del perfil de usuario.
 * Proporciona interfaces para la actualización de datos personales, carga de avatares,
 * modificación de credenciales de seguridad y eliminación de cuenta.
 * Implementa validaciones reactivas y sincronización de estados con servicios externos.
 */
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { UploadService } from '../../../core/services/upload.service';
import { User, SewingLevel, UpdateProfilePayload } from '../../../shared/models/user.model';
import { ConfirmModalComponent } from '../../../shared/modals/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [ReactiveFormsModule, ConfirmModalComponent],
  templateUrl: './perfil.html',
})
export class Perfil implements OnInit {
  /* Inyección de dependencias para lógica de negocio y navegación */
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private uploadService = inject(UploadService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  /** Entidad del usuario autenticado */
  user: User | null = null;

  /** Formulario reactivo para datos demográficos y de interés */
  profileForm: FormGroup;
  /** Formulario reactivo para la gestión de credenciales de acceso */
  passwordForm: FormGroup;

  /* Estados de carga y feedback transaccional */
  isLoading = true;
  isSaving = false;
  isSavingPassword = false;
  isUploadingAvatar = false;

  successMessage = '';
  errorMessage = '';

  /** URL temporal o persistente para la previsualización del avatar */
  avatarPreview: string | null = null;
  /** Opciones predefinidas para el nivel de competencia técnica del usuario */
  sewingLevels: SewingLevel[] = ['Principiante', 'Intermedio', 'Experto'];

  /** Control de visibilidad para el diálogo de confirmación de borrado de cuenta */
  isDeleteModalOpen = false;
  /** Estado de bloqueo durante el proceso de eliminación en el servidor */
  isDeletingAccount = false;

  constructor() {
    this.profileForm = this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(3)]],
      sewingLevel: [null],
      interests: [''],
      avatar: [null],
    });

    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  /**
   * Validador personalizado para asegurar la paridad entre la nueva contraseña y su confirmación.
   * @param g Grupo de controles que contiene los campos de contraseña.
   */
  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  ngOnInit() {
    this.loadUserData();
  }

  /**
   * Recupera la información del usuario desde el servicio de persistencia
   * e inicializa los valores de los formularios reactivos.
   */
  loadUserData() {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.userService.getMe().subscribe({
      next: (response) => {
        this.user = response.data;
        this.avatarPreview = this.user.avatar;

        this.profileForm.patchValue({
          displayName: this.user.displayName,
          sewingLevel: this.user.sewingLevel || null,
          interests: this.user.interests ? this.user.interests.join(', ') : '',
          avatar: null,
        });

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar los datos del perfil.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Gestiona la selección y carga asíncrona de archivos multimedia a la nube.
   * Valida restricciones de tamaño antes de iniciar la transferencia.
   * @param event Evento de selección del input file.
   */
  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        this.showError('La imagen es demasiado grande. Máximo 2MB.');
        return;
      }

      this.isUploadingAvatar = true;
      this.cdr.detectChanges();

      this.uploadService.uploadImage(file, 'costura_avatars').subscribe({
        next: (cloudinaryResponse) => {
          this.avatarPreview = cloudinaryResponse.secure_url;
          this.profileForm.patchValue({ avatar: cloudinaryResponse.secure_url });
          this.profileForm.markAsDirty();
          this.isUploadingAvatar = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.showError('Error al subir la imagen de perfil.');
          this.isUploadingAvatar = false;
          this.cdr.detectChanges();
        },
      });
    }
  }

  /**
   * Procesa la actualización de la información del perfil.
   * Transforma la cadena de intereses en un array sanitizado antes del envío al backend.
   */
  onSubmit() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
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

    if (formValue.avatar) payload.avatar = formValue.avatar;

    this.userService.updateMe(payload).subscribe({
      next: (response) => {
        this.user = response.data;
        this.profileForm.markAsPristine();
        this.showSuccess('¡Tu perfil se ha actualizado correctamente!');
        this.isSaving = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.showError(err.error?.message || 'Hubo un error al actualizar tu perfil.');
        this.isSaving = false;
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Ejecuta el cambio de contraseña tras validar la identidad con la clave actual.
   */
  onPasswordSubmit() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isSavingPassword = true;
    this.cdr.detectChanges();

    const formValue = this.passwordForm.value;

    this.userService
      .updatePassword({
        currentPassword: formValue.currentPassword,
        newPassword: formValue.newPassword,
      })
      .subscribe({
        next: () => {
          this.showSuccess('Contraseña actualizada con éxito.');
          this.passwordForm.reset();
          this.isSavingPassword = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.showError(
            err.error?.message || 'La contraseña actual es incorrecta o hubo un error.',
          );
          this.isSavingPassword = false;
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Inicia el flujo de recuperación de contraseña enviando un correo electrónico al usuario.
   */
  onRecoverPassword() {
    if (!this.user?.email) return;

    this.authService.recoverPassword(this.user.email).subscribe({
      next: () => {
        this.showSuccess(`Se han enviado instrucciones de recuperación a ${this.user?.email}`);
      },
      error: (err) => {
        this.showError(err.error?.message || 'Error al intentar enviar el correo de recuperación.');
      },
    });
  }

  openDeleteModal() {
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal() {
    this.isDeleteModalOpen = false;
  }

  /**
   * Realiza la eliminación definitiva de la cuenta.
   * Al completarse, invalida la sesión local y redirige al usuario a la vista de login.
   */
  confirmDeleteAccount() {
    this.isDeletingAccount = true;
    this.cdr.detectChanges();

    this.userService.deleteMe().subscribe({
      next: () => {
        localStorage.removeItem('accessToken');
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.showError(err.error?.message || 'No se pudo eliminar la cuenta en este momento.');
        this.isDeletingAccount = false;
        this.isDeleteModalOpen = false;
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Gestiona la visualización temporal de mensajes de confirmación.
   */
  private showSuccess(msg: string) {
    this.errorMessage = '';
    this.successMessage = msg;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.successMessage = '';
      this.cdr.detectChanges();
    }, 4000);
  }

  /**
   * Gestiona la visualización temporal de mensajes de error.
   */
  private showError(msg: string) {
    this.successMessage = '';
    this.errorMessage = msg;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.errorMessage = '';
      this.cdr.detectChanges();
    }, 5000);
  }
}
