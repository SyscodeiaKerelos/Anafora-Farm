import { ErrorHandler, inject, Injectable } from '@angular/core';

import { NotificationService } from '../services/notification.service';
import { TranslationService } from '../services/translation.service';

const FALLBACK_ERROR_KEY = 'translate_error-generic';

@Injectable()
export class GlobalErrorHandler extends ErrorHandler {
  private readonly notification = inject(NotificationService);
  private readonly translation = inject(TranslationService);

  override handleError(error: unknown): void {
    const message = this.extractMessage(error);
    this.notification.showError(message);
    super.handleError(error);
  }

  private extractMessage(error: unknown): string {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    try {
      const msg = (error as { message?: string })?.message;
      if (typeof msg === 'string') return msg;
    } catch {
      // ignore
    }
    return this.translation.instant(FALLBACK_ERROR_KEY);
  }
}
