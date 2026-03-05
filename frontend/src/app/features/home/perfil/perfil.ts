import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { UploadService } from '../../../core/services/upload.service'; // Añadido
import { User, SewingLevel, UpdateProfilePayload } from '../../../shared/models/user.model';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './perfil.html',
})
export class Perfil implements OnInit {
  private userService = inject(UserService);
  private uploadService = inject(UploadService); // Inyectamos el servicio
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  user: User | null = null;
  profileForm: FormGroup;

  isLoading = true;
  isSaving = false;
  isUploadingAvatar = false; // Nuevo estado de carga
  successMessage = '';
  errorMessage = '';

  avatarPreview: string | null = null;

  sewingLevels: SewingLevel[] = ['Principiante', 'Intermedio', 'Experto'];

  constructor() {
    this.profileForm = this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(3)]],
      sewingLevel: [null],
      interests: [''],
      avatar: [null],
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
        console.error('Error al cargar perfil', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  // Método modificado para subir a Cloudinary
  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        this.errorMessage = 'La imagen es demasiado grande. Máximo 2MB.';
        this.cdr.detectChanges();
        return;
      }

      this.errorMessage = '';
      this.isUploadingAvatar = true; // Bloqueamos la UI
      this.cdr.detectChanges();

      // Subimos usando la carpeta 'costura_avatars'
      this.uploadService.uploadImage(file, 'costura_avatars').subscribe({
        next: (cloudinaryResponse) => {
          this.avatarPreview = cloudinaryResponse.secure_url;
          this.profileForm.patchValue({ avatar: cloudinaryResponse.secure_url });
          this.profileForm.markAsDirty();
          this.isUploadingAvatar = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.errorMessage = 'Error al subir la imagen de perfil a Cloudinary.';
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

    if (formValue.avatar) {
      payload.avatar = formValue.avatar;
    }

    this.userService.updateMe(payload).subscribe({
      next: (response) => {
        this.user = response.data;
        this.profileForm.markAsPristine();
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
