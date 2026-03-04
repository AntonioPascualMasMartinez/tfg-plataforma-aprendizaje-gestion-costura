import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import {
  SocialAuthServiceConfig,
  GoogleLoginProvider,
  SocialLoginModule,
} from '@abacritt/angularx-social-login';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]), withFetch()),

    importProvidersFrom(SocialLoginModule),

    {
      provide: 'SocialAuthServiceConfig', // ¡En la v2.4.0 esto funciona perfecto!
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
        onError: (err) => console.error(err),
      } as SocialAuthServiceConfig,
    },
  ],
};
