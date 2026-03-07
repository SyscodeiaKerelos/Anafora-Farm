import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import { TranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader, TranslateHttpLoader } from '@ngx-translate/http-loader';
import Aura from '@primeuix/themes/aura';
import { provideIcons } from '@ng-icons/core';
import { provideFirebaseApp, FirebaseApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

import { routes } from './app.routes';
import { APP_ICONS } from './core/icons';
import { initializeApp } from '@angular/fire/app';
import { TranslationService } from './core/services/translation.service';
import { AuthService } from './core/services/auth.service';
import { UserDirectoryService } from './core/services/user-directory.service';
import { environment } from '../environments/environment';

export function createTranslateLoader() {
  return new TranslateHttpLoader();
}

export function initializeFirebase() {
  return initializeApp(environment.firebase);
}
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    provideFirebaseApp(() => initializeFirebase()),
    provideFirestore((injector) => getFirestore(injector.get(FirebaseApp))),
    {
      provide: TranslateLoader,
      useFactory: createTranslateLoader,
    },
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: '/assets/i18n/',
        suffix: '.json'
      }),
      fallbackLang: 'en',
    }),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.dark',
          rtl: { enable: true },
        },
      },
    }),
    provideIcons(APP_ICONS),
    TranslationService,
    AuthService,
    UserDirectoryService,
  ],
};
