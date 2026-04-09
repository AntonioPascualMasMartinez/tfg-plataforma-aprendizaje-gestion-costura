/**
 * @file app.config.ts
 * @description Configuración global y núcleo de proveedores de la aplicación Angular.
 * Establece los servicios fundamentales a nivel de raíz, incluyendo el sistema de enrutamiento,
 * la configuración de hidratación para el Server-Side Rendering (SSR), el cliente HTTP con
 * sus interceptores de ciclo de vida (autenticación y manejo de errores), y la integración
 * del proveedor de identidad federado (Google OAuth 2.0).
 */
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import {
  SocialAuthServiceConfig,
  GoogleLoginProvider,
  SocialLoginModule,
} from '@abacritt/angularx-social-login';

export const appConfig: ApplicationConfig = {
  providers: [
    /* Inicialización del enrutador principal de la SPA */
    provideRouter(routes),

    /* Configuración de hidratación para transición fluida entre el DOM del servidor y el cliente */
    provideClientHydration(withEventReplay()),

    /* Configuración del cliente HTTP optimizado con Fetch API y registro de interceptores globales */
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]), withFetch()),

    /* Proveedores externos de librerías de terceros (Módulos de login social y gráficos) */
    importProvidersFrom(SocialLoginModule),
    provideCharts(withDefaultRegisterables()),

    /* Configuración explícita del servicio de autenticación social para Google Workspace/Identity */
    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(
              '221995551-tnabqtqqo41n0cno3etmbeaqpjmktnpr.apps.googleusercontent.com',
            ),
          },
        ],
        onError: (err) => console.error('Error en el proveedor de autenticación social:', err),
      } as SocialAuthServiceConfig,
    },
  ],
};
