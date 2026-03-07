import { ApplicationConfig, provideBrowserGlobalErrorListeners, APP_INITIALIZER } from '@angular/core';
import { ErrorHandler } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
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
import { GlobalErrorHandler } from './core/errors/global-error.handler';
import { httpErrorInterceptor } from './core/interceptors/http-error.interceptor';
import { environment } from '../environments/environment';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

function getInitialLang(): 'en' | 'ar' {
  if (typeof localStorage === 'undefined') return 'en';
  const saved = localStorage.getItem('app-language') as 'en' | 'ar' | null;
  if (saved === 'en' || saved === 'ar') return saved;
  const browser = typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : '';
  return browser === 'ar' ? 'ar' : 'en';
}

export function initTranslations(translate: TranslateService): () => Promise<unknown> {
  return () => {
    const lang = getInitialLang();
    return firstValueFrom(translate.use(lang));
  };
}

export function initializeFirebase() {
  return initializeApp(environment.firebase);
}
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // provideHttpClient(),
    provideHttpClient(withInterceptors([httpErrorInterceptor])),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideFirebaseApp(() => initializeFirebase()),
    provideFirestore((injector) => getFirestore(injector.get(FirebaseApp))),
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: '/assets/i18n/',
        suffix: '.json',
      }),
      fallbackLang: 'en',
      lang: 'en',
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
