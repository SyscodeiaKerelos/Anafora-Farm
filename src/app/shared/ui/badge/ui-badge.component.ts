import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

type BadgeTone = 'emerald' | 'sky' | 'amber' | 'neutral';

@Component({
  selector: 'app-ui-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe],
  host: {
    class: 'inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium',
  },
  template: `
    @switch (tone()) {
      @case ('emerald') {
        <span
          class="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-200"
        >
          @if (labelKey()) {
            {{ labelKey() | translate }}
          } @else {
            <ng-content />
          }
        </span>
      }
      @case ('sky') {
        <span
          class="inline-flex items-center rounded-full bg-sky-500/10 px-3 py-1 text-[11px] font-medium text-sky-700 dark:text-sky-200"
        >
          @if (labelKey()) {
            {{ labelKey() | translate }}
          } @else {
            <ng-content />
          }
        </span>
      }
      @case ('amber') {
        <span
          class="inline-flex items-center rounded-full bg-amber-400/10 px-3 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-200"
        >
          @if (labelKey()) {
            {{ labelKey() | translate }}
          } @else {
            <ng-content />
          }
        </span>
      }
      @default {
        <span
          class="inline-flex items-center rounded-full bg-slate-500/10 px-3 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200"
        >
          @if (labelKey()) {
            {{ labelKey() | translate }}
          } @else {
            <ng-content />
          }
        </span>
      }
    }
  `,
})
export class UiBadge {
  readonly labelKey = input<string | null>(null);
  readonly tone = input<BadgeTone>('neutral');
}

