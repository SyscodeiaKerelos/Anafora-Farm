import { Injectable, signal, computed } from '@angular/core';

export type NotificationSeverity = 'error' | 'success' | 'info';

export interface AppNotification {
  id: string;
  message: string;
  severity: NotificationSeverity;
  createdAt: number;
}

const AUTO_DISMISS_MS = 5000;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _notifications = signal<AppNotification[]>([]);
  readonly notifications = this._notifications.asReadonly();

  readonly hasNotifications = computed(() => this._notifications().length > 0);

  /**
   * Show an error notification (e.g. from failed requests or unhandled errors).
   */
  showError(message: string): void {
    this.add(message, 'error');
  }

  /**
   * Show a success notification.
   */
  showSuccess(message: string): void {
    this.add(message, 'success');
  }

  /**
   * Show an info notification.
   */
  showInfo(message: string): void {
    this.add(message, 'info');
  }

  /**
   * Add a notification and optionally auto-dismiss after a delay.
   */
  add(message: string, severity: NotificationSeverity = 'info', autoDismiss = true): void {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const notification: AppNotification = { id, message, severity, createdAt: Date.now() };
    this._notifications.update((list) => [...list, notification]);
    if (autoDismiss) {
      setTimeout(() => this.dismiss(id), AUTO_DISMISS_MS);
    }
  }

  /**
   * Remove a notification by id.
   */
  dismiss(id: string): void {
    this._notifications.update((list) => list.filter((n) => n.id !== id));
  }
}
