import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { AuthShell } from '../shell/auth-shell';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [RouterLink, AuthShell, ReactiveFormsModule],
  templateUrl: './reset-password.html',
})
export class ResetPassword implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  token: string | null = null;
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  resetForm: FormGroup = this.fb.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: this.passwordMatchValidator },
  );

  ngOnInit() {
    // Capturamos el token de la URL (ej: ?token=...)
    this.token = this.route.snapshot.queryParamMap.get('token');

    if (!this.token) {
      this.errorMessage =
        'Enlace inválido o expirado. Por favor, solicita un nuevo enlace de recuperación.';
    }
  }

  // Validador personalizado para confirmar que las contraseñas coinciden
  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit() {
    if (this.resetForm.invalid || !this.token) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      token: this.token,
      newPassword: this.resetForm.value.newPassword,
    };

    this.authService.resetPassword(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Tu contraseña ha sido actualizada correctamente.';
        this.resetForm.reset();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage =
          err.error?.message ||
          'Hubo un error al restablecer tu contraseña. El enlace podría haber expirado.';
      },
    });
  }
}
