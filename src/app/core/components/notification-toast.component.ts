import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-notification-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  host: {
    class: 'fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none',
    'aria-live': 'polite',
    'aria-atomic': 'true',
  },
  template: `
    @for (n of notificationService.notifications(); track n.id) {
      <div
        role="alert"
        class="pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-sm transition"
        [class.border-red-200]="n.severity === 'error'"
        [class.bg-red-50]="n.severity === 'error'"
        [class.text-red-800]="n.severity === 'error'"
        [class.dark:border-red-800]="n.severity === 'error'"
        [class.dark:bg-red-950/90]="n.severity === 'error'"
        [class.dark:text-red-200]="n.severity === 'error'"
        [class.border-emerald-200]="n.severity === 'success'"
        [class.bg-emerald-50]="n.severity === 'success'"
        [class.text-emerald-800]="n.severity === 'success'"
        [class.dark:border-emerald-800]="n.severity === 'success'"
        [class.dark:bg-emerald-950/90]="n.severity === 'success'"
        [class.dark:text-emerald-200]="n.severity === 'success'"
        [class.border-slate-200]="n.severity === 'info'"
        [class.bg-white/90]="n.severity === 'info'"
        [class.text-slate-800]="n.severity === 'info'"
        [class.dark:border-slate-600]="n.severity === 'info'"
        [class.dark:bg-slate-800/90]="n.severity === 'info'"
        [class.dark:text-slate-200]="n.severity === 'info'"
      >
        <div class="flex items-start justify-between gap-2">
          <p class="min-w-0 flex-1">{{ n.message }}</p>
          <button
            type="button"
            class="shrink-0 rounded p-1 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-inset"
            [attr.aria-label]="'Close'"
            (click)="notificationService.dismiss(n.id)"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      </div>
    }
  `,
})
export class NotificationToastComponent {
  readonly notificationService = inject(NotificationService);
}
