import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
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

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  isLoading = false;
  errorMessage = '';

  ngOnInit() {
    // Protección para que no se ejecute en el servidor (SSR)
    if (isPlatformBrowser(this.platformId)) {
      this.socialAuthService.authState.subscribe((user) => {
        if (user && user.idToken) {
          this.isLoading = true;
          this.authService.googleAuth({ idToken: user.idToken }).subscribe({
            next: (response) => {
              localStorage.setItem('accessToken', response.data.accessToken);
              console.log('Login con Google exitoso', response.data.user);
              this.router.navigate(['/home']);
            },
            error: (err) => {
              this.isLoading = false;
              this.errorMessage = err.error?.message || 'Error al iniciar sesión con Google.';
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
        console.log('Login exitoso', response.data.user);
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage =
          err.error?.message || 'Correo o contraseña incorrectos. Intenta de nuevo.';
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }
}
