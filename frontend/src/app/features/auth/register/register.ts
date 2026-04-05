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
  // Control de las fases del registro (1: Básico, 2: Intereses, 3: Confirmación)
  currentStep = 1;

  interestsList = ['Accesorios', 'Bordado', 'Ropa a medida', 'Sastrería', 'Upcycling'];

  registerForm: FormGroup = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    sewingLevel: [null], // Opcional
    interests: [[]], // Array opcional
  });

  showPassword = false;

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
  
  isLoading = false;
  errorMessage = '';

  // Getter para saber si podemos avanzar al paso 2
  get isStep1Valid(): boolean {
    const nameValid = this.registerForm.get('displayName')?.valid ?? false;
    const emailValid = this.registerForm.get('email')?.valid ?? false;
    const passwordValid = this.registerForm.get('password')?.valid ?? false;
    return nameValid && emailValid && passwordValid;
  }

  ngOnInit() {
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
              this.errorMessage = err.error?.message || 'Error al iniciar sesión con Google.';
              this.cdr.detectChanges(); // 3. Forzar actualización
            },
          });
        }
      });
    }
  }

  onInterestChange(event: Event) {
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

  // Métodos de navegación entre fases
  nextStep() {
    if (this.isStep1Valid) {
      this.currentStep = 2;
    }
  }

  prevStep() {
    this.currentStep = 1;
  }

  onSubmit() {
    if (this.registerForm.invalid) return;
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.currentStep = 3; // Mover a pantalla de éxito
        this.cdr.detectChanges(); // 4. Forzar cambio de paso en el HTML
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Error al crear la cuenta.';
        this.cdr.detectChanges(); // 5. Mostrar error
      },
      complete: () => {
        this.isLoading = false;
        this.cdr.detectChanges(); // 6. Limpiar estado de carga
      },
    });
  }
}
