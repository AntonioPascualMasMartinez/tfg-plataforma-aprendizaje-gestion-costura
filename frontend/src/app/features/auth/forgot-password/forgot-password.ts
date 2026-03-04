import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthShell } from '../shell/auth-shell';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [RouterLink, AuthShell, ReactiveFormsModule],
  templateUrl: './forgot-password.html',
})
export class ForgotPassword {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  recoverForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  isLoading = false;
  successMessage = '';
  errorMessage = '';

  onSubmit() {
    if (this.recoverForm.invalid) return;

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const email = this.recoverForm.value.email;

    this.authService.recoverPassword(email).subscribe({
      next: (response) => {
        this.isLoading = false;
        // Asumiendo que el backend devuelve un string en message
        this.successMessage =
          response.message || 'Se ha enviado un enlace a tu correo electrónico.';
        this.recoverForm.reset();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Hubo un error al procesar tu solicitud.';
      },
    });
  }
}
