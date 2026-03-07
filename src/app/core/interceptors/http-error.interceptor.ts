import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { NotificationService } from '../services/notification.service';
import { TranslationService } from '../services/translation.service';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  // Skip translation loader requests: avoid injecting TranslationService during i18n fetch
  // (constructor calls translate.use() and can race with the loader / show keys).
  if (req.url.includes('/assets/i18n/')) {
    return next(req);
  }

  const notification = inject(NotificationService);
  const translation = inject(TranslationService);

  return next(req).pipe(
    catchError((error: unknown) => {
      const message = getMessage(error, translation);
      notification.showError(message);
      return throwError(() => error);
    }),
  );
};

function getMessage(error: unknown, translation: TranslationService): string {
  if (error instanceof HttpErrorResponse) {
    if (error.error?.message && typeof error.error.message === 'string') {
      return error.error.message;
    }
    if (error.status === 0) {
      return translation.instant('translate_error-http');
    }
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return translation.instant('translate_error-http');
}
