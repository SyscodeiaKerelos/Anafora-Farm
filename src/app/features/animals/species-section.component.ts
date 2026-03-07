import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

import type { Species } from '../../core/types/species';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-species-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe],
  host: {
    class: 'block',
  },
  template: `
    <section class="card-glass p-4 sm:p-6 rounded-xl sm:rounded-2xl">
      <h2 class="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-50">
        {{ 'translate_animals-species-title' | translate }}
      </h2>
      @if (loading()) {
        <p class="mt-2 text-xs text-muted">...</p>
      } @else if (species().length === 0) {
        <p class="mt-2 text-xs text-muted">{{ 'translate_animals-species-empty' | translate }}</p>
      } @else {
        <div class="mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2">
          @for (s of species(); track s.id) {
            <span
              class="inline-flex items-center gap-1 sm:gap-1.5 rounded-full border border-slate-200/70 bg-white/60 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs dark:border-white/10 dark:bg-slate-900/60"
            >
              <span>{{ displayName(s) }}</span>
              <span class="text-muted">
                ({{ s.reproductionType === 'lays_egg' ? ('translate_animals-reproduction-lays-egg' | translate) : ('translate_animals-reproduction-gives-birth' | translate) }})
              </span>
            </span>
          }
        </div>
      }
    </section>
  `,
})
export class SpeciesSectionComponent {
  readonly species = input<Species[]>([]);
  readonly loading = input(false);

  private readonly translation = inject(TranslationService);

  protected displayName(s: Species): string {
    return this.translation.currentLang() === 'ar' ? s.nameAr : s.nameEn;
  }
}
