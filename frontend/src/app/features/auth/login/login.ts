/**
 * @file login.ts
 * @description Componente principal de acceso al sistema (Pasarela de Autenticación).
 * Soporta autenticación mediante credenciales tradicionales (JWT local) y autenticación
 * delegada OAuth 2.0 (Google). Gestiona el enrutamiento condicional post-login en base
 * a la jerarquía de roles (RBAC) del usuario autenticado, asegurando compatibilidad con SSR.
 */
import { ChangeDetectorRef, Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { AuthShell } from '../shell/auth-shell';
import { AuthService } from '../../../core/services/auth.service';
import { SocialAuthService, GoogleSigninButtonModule } from '@abacritt/angularx-social-login';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, AuthShell, ReactiveFormsModule, GoogleSigninButtonModule],
  templateUrl: './login.html',
})
export class Login implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private socialAuthService = inject(SocialAuthService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  showPassword = false;
  isLoading = false;
  errorMessage = '';

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Ciclo de vida: Inicialización.
   * Suscribe el componente a los cambios de estado del proveedor OAuth externo.
   * La instanciación se restringe explícitamente al entorno del navegador (isPlatformBrowser)
   * para evitar excepciones de acceso al objeto 'window' durante el Server-Side Rendering (SSR).
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

              /* Control de Flujo de Navegación Basado en Roles (RBAC) */
              if (response.data.user.role === 'Admin') {
                this.router.navigate(['/admin']);
              } else {
                this.router.navigate(['/home']);
              }
            },
            error: (err) => {
              this.isLoading = false;
              this.errorMessage = err.error?.message || 'Error al iniciar sesión con Google.';
              this.cdr.detectChanges();
            },
          });
        }
      });
    }
  }

  /**
   * Orquesta el proceso de autenticación por formulario tradicional.
   */
  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        /* Persistencia temporal del token JWT para consumo en interceptores HTTP */
        localStorage.setItem('accessToken', response.data.accessToken);

        if (response.data.user.role === 'Admin') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Correo o contraseña incorrectos.';
        this.cdr.detectChanges();
      },
      complete: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
