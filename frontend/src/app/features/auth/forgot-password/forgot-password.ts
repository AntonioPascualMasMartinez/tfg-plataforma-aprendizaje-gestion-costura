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
        this.successMessage =
          response.message || 'Se ha enviado un enlace a tu correo electrónico.';
        this.recoverForm.reset();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        //Hacemos la lectura del error más robusta por si el interceptor devuelve un string o altera el objeto
        this.errorMessage = typeof err === 'string' ? err : (err.error?.message || err.message || 'Hubo un error al procesar tu solicitud.');
        this.cdr.detectChanges(); 
      },
    });
  }
}