import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'xs' | 'sm' | 'md';
type ButtonType = 'button' | 'submit';
type IconPosition = 'left' | 'right';

@Component({
  selector: 'app-ui-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe],
  host: {
    class:
      'inline-flex items-center justify-center rounded-full text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:opacity-60 disabled:cursor-not-allowed',
    '[class.btn-primary]': 'variant() === "primary" || variant() === "danger"',
    '[class.btn-ghost]': 'variant() === "ghost" || variant() === "outline"',
  },
  template: `
    <button
      [attr.type]="type()"
      [disabled]="disabled() || loading()"
      class="inline-flex items-center gap-1.5 rounded-full"
      [class.px-2]="size() === 'xs'"
      [class.py-0.5]="size() === 'xs'"
      [class.text-[11px]]="size() === 'xs'"
      [class.px-3]="size() === 'sm'"
      [class.py-1]="size() === 'sm'"
      [class.px-5]="size() === 'md'"
      [class.py-2.5]="size() === 'md'"
    >
      @if (loading()) {
        <span class="inline-flex items-center gap-2">
          <span
            class="h-3 w-3 animate-spin rounded-full border border-slate-900 dark:border-slate-50 border-t-transparent"
          ></span>
          @if (labelKey()) {
            <span>{{ labelKey() | translate }}</span>
          }
        </span>
      } @else {
        @if (icon() && iconPosition() === 'left') {
          <i [class]="icon()" aria-hidden="true"></i>
        }

        @if (labelKey()) {
          <span>{{ labelKey() | translate }}</span>
        } @else {
          <ng-content />
        }

        @if (icon() && iconPosition() === 'right') {
          <i [class]="icon()" aria-hidden="true"></i>
        }
      }
    </button>
  `,
})
export class UiButton {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly type = input<ButtonType>('button');
  readonly icon = input<string | null>(null);
  readonly iconPosition = input<IconPosition>('left');
  readonly labelKey = input<string | null>(null);
  readonly loading = input(false);
  readonly disabled = input(false);
}

