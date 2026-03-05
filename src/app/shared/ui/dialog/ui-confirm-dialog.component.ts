import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

import { UiButton } from '../button/ui-button.component';

@Component({
  selector: 'app-ui-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe, UiButton],
  template: `
    @if (open()) {
      <div
        class="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4"
        role="dialog"
        aria-modal="true"
      >
        <div class="card-glass max-w-sm rounded-2xl px-5 py-4 text-xs">
          <h2 class="text-sm font-semibold text-slate-900 dark:text-slate-50">
            {{ titleKey() | translate }}
          </h2>
          <p class="mt-2 text-muted">
            {{ messageKey() | translate }}
          </p>

          <div class="mt-4 flex justify-end gap-2">
            <app-ui-button
              variant="ghost"
              size="sm"
              [labelKey]="cancelLabelKey()"
              (click)="onCancel()"
            />
            <app-ui-button
              variant="primary"
              size="sm"
              [labelKey]="confirmLabelKey()"
              (click)="onConfirm()"
            />
          </div>
        </div>
      </div>
    }
  `,
})
export class UiConfirmDialog {
  readonly open = input(false);
  readonly titleKey = input.required<string>();
  readonly messageKey = input.required<string>();
  readonly confirmLabelKey = input.required<string>();
  readonly cancelLabelKey = input<string>('translate_cancel');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  protected onConfirm(): void {
    this.confirmed.emit();
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }
}

