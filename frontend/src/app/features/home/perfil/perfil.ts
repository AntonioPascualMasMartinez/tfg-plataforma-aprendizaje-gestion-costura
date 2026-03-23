import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // NUEVO
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service'; // NUEVO
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
  private userService = inject(UserService);
  private authService = inject(AuthService); // Inyectado
  private uploadService = inject(UploadService);
  private router = inject(Router); // Inyectado
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  user: User | null = null;

  profileForm: FormGroup;
  passwordForm: FormGroup;

  isLoading = true;
  isSaving = false;
  isSavingPassword = false;
  isUploadingAvatar = false;

  successMessage = '';
  errorMessage = '';

  avatarPreview: string | null = null;
  sewingLevels: SewingLevel[] = ['Principiante', 'Intermedio', 'Experto'];

  isDeleteModalOpen = false;
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

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
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
      error: (err) => {
        this.errorMessage = 'No se pudieron cargar los datos del perfil.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

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

  // --- MÉTODOS DE SEGURIDAD REALES ---

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

  confirmDeleteAccount() {
    this.isDeletingAccount = true;
    this.cdr.detectChanges();

    this.userService.deleteMe().subscribe({
      next: () => {
        // Al terminar bien, limpiamos y redirigimos (no hace falta cerrar modal porque nos vamos de la vista)
        localStorage.removeItem('accessToken');
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.showError(err.error?.message || 'No se pudo eliminar la cuenta en este momento.');
        this.isDeletingAccount = false;
        this.isDeleteModalOpen = false; // Cerramos el modal en caso de error
        this.cdr.detectChanges();
      }
    });
  }

  // Helpers para mensajes
  private showSuccess(msg: string) {
    this.errorMessage = '';
    this.successMessage = msg;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.successMessage = '';
      this.cdr.detectChanges();
    }, 4000);
  }

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
