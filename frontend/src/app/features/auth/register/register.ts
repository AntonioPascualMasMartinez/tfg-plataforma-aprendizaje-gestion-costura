/**
 * @file register.ts
 * @description Componente responsable del flujo de creación de nuevas cuentas de usuario.
 * Implementa un patrón de diseño tipo asistente (Wizard) de múltiples fases, empleando
 * formularios reactivos (ReactiveForms) para la validación progresiva de datos. Soporta
 * tanto el registro tradicional por credenciales como la delegación de identidad vía OAuth 2.0 (Google).
 */
import { ChangeDetectorRef, Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthShell } from '../shell/auth-shell';
import { AuthService } from '../../../core/services/auth.service';
import { SocialAuthService, GoogleSigninButtonModule } from '@abacritt/angularx-social-login';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, AuthShell, ReactiveFormsModule, GoogleSigninButtonModule],
  templateUrl: './register.html',
})
export class Register implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private socialAuthService = inject(SocialAuthService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  /** * Máquina de estados que controla el flujo de la interfaz del asistente.
   * Fases: 1 (Credenciales base), 2 (Perfilado de intereses), 3 (Confirmación de éxito).
   */
  currentStep = 1;

  /** Diccionario estático de categorías para la personalización del perfil de usuario. */
  interestsList = ['Accesorios', 'Bordado', 'Ropa a medida', 'Sastrería', 'Upcycling'];

  /**
   * Estructura reactiva del formulario. Agrupa tanto atributos obligatorios
   * de seguridad como metadatos opcionales para la segmentación del usuario.
   */
  registerForm: FormGroup = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    sewingLevel: ['Principiante'],
    interests: [[]],
  });

  showPassword = false;
  isLoading = false;
  errorMessage = '';

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Propiedad computada que evalúa la completitud estructural de la primera fase del registro.
   * @returns {boolean} Confirmación de validez de los controles críticos.
   */
  get isStep1Valid(): boolean {
    const nameValid = this.registerForm.get('displayName')?.valid ?? false;
    const emailValid = this.registerForm.get('email')?.valid ?? false;
    const passwordValid = this.registerForm.get('password')?.valid ?? false;
    return nameValid && emailValid && passwordValid;
  }

  /**
   * Ciclo de vida: Inicialización.
   * Establece la suscripción asíncrona al proveedor de identidad de Google.
   * Se aísla la ejecución condicionalmente al entorno del cliente para evitar fallos de hidratación en SSR.
   */
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.socialAuthService.authState.subscribe((user) => {
        if (user && user.idToken) {
          this.isLoading = true;
          this.cdr.detectChanges();

          this.authService.googleAuth({ idToken: user.idToken }).subscribe({
            next: (response) => {
              localStorage.setItem('accessToken', response.data.accessToken);
              this.router.navigate(['/home']);
            },
            error: (err) => {
              this.isLoading = false;
              this.errorMessage =
                err.error?.message || 'Error al procesar la autenticación con Google.';
              this.cdr.detectChanges();
            },
          });
        }
      });
    }
  }

  /**
   * Captura la interacción sobre el conjunto de casillas de verificación (Checkboxes)
   * y muta el arreglo interno del control reactivo preservando la inmutabilidad de los datos.
   * @param {Event} event - Evento nativo del DOM disparado por la entrada del usuario.
   */
  onInterestChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const value = checkbox.value;
    const interestsControl = this.registerForm.get('interests');
    let currentInterests: string[] = interestsControl?.value || [];

    if (checkbox.checked) {
      currentInterests.push(value);
    } else {
      currentInterests = currentInterests.filter((i) => i !== value);
    }

    interestsControl?.setValue(currentInterests);
  }

  /* ==========================================================================
     TRANSICIONES DEL ASISTENTE DE REGISTRO
     ========================================================================== */

  nextStep(): void {
    if (this.isStep1Valid) {
      this.currentStep = 2;
    }
  }

  prevStep(): void {
    this.currentStep = 1;
  }

  /**
   * Culmina el flujo recolectando la carga útil del formulario reactivo y
   * transmitiendo los datos al servicio de identidad para su persistencia en base de datos.
   */
  onSubmit(): void {
    if (this.registerForm.invalid) return;
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        /* Transición a la vista de confirmación (Paso 3) tras una resolución exitosa */
        this.currentStep = 3;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Error durante la provisión de la cuenta.';
        this.cdr.detectChanges();
      },
      complete: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
