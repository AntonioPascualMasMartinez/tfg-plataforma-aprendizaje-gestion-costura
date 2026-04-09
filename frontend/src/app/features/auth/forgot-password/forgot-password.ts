/**
 * @file forgot-password.ts
 * @description Componente gestor del inicio del flujo de recuperación de credenciales.
 * Utiliza formularios reactivos para validar sintácticamente la entrada del usuario antes
 * de solicitar al backend la emisión de un token criptográfico a través de correo electrónico.
 */
import { Component, inject, ChangeDetectorRef } from '@angular/core';
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
  private cdr = inject(ChangeDetectorRef);

  /** Estructura reactiva con validación estricta de formato de correo electrónico. */
  recoverForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  isLoading = false;
  successMessage = '';
  errorMessage = '';

  /**
   * Ejecuta la solicitud de recuperación tras validar la integridad del formulario local.
   */
  onSubmit(): void {
    if (this.recoverForm.invalid) return;

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const email = this.recoverForm.value.email;

    this.authService.recoverPassword(email).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage =
          response.message || 'Se ha enviado un enlace a tu correo electrónico.';
        this.recoverForm.reset();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        /* Resolución dinámica del objeto de error para prevenir fallos de lectura en 
           excepciones interceptadas o errores nativos de red. */
        this.errorMessage =
          typeof err === 'string'
            ? err
            : err.error?.message || err.message || 'Hubo un error al procesar tu solicitud.';
        this.cdr.detectChanges();
      },
    });
  }
}
