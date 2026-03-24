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
  // Añadimos GoogleSigninButtonModule a los imports
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

  isLoading = false;
  errorMessage = '';

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.socialAuthService.authState.subscribe((user) => {
        if (user && user.idToken) {
          this.isLoading = true;
          this.cdr.detectChanges(); // Forzar estado "Verificando..."

          this.authService.googleAuth({ idToken: user.idToken }).subscribe({
            next: (response) => {
              localStorage.setItem('accessToken', response.data.accessToken);

              // Verificamos el rol del usuario
              if (response.data.user.role === 'Admin') {
                this.router.navigate(['/admin']);
              } else {
                this.router.navigate(['/home']);
              }
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

  onSubmit() {
    if (this.loginForm.invalid) return;
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        localStorage.setItem('accessToken', response.data.accessToken);

        // Verificamos el rol del usuario
        if (response.data.user.role === 'Admin') {
          this.router.navigate(['/admin/dashboard']); // O la ruta raíz que decidas para admin
        } else {
          this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Correo o contraseña incorrectos.';
        this.cdr.detectChanges(); // 4. Forzar actualización
      },
      complete: () => {
        this.isLoading = false;
        this.cdr.detectChanges(); // 5. Asegurar que el botón vuelva a su estado original
      },
    });
  }
}
