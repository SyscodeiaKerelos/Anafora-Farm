import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  effect,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs/operators';

import type { AnimalStatus } from '../../core/types/animal-status';
import type { AnimalCommentType } from '../../core/types/animal-comment';
import { AnimalWithSpecies } from '../../core/types/animal';
import { AnimalComment } from '../../core/types/animal-comment';
import { getAgeFromBirthDate } from '../../core/utils/age.util';
import { AnimalsService } from './services/animals.service';
import { AnimalCommentsService } from './services/animal-comments.service';
import { TranslationService } from '../../core/services/translation.service';
import { UiButton } from '../../shared/ui/button/ui-button.component';

const STATUS_KEYS: Record<AnimalStatus, string> = {
  newborn: 'translate_animals-status-newborn',
  gives_egg: 'translate_animals-status-gives-egg',
  alive: 'translate_animals-status-alive',
  died: 'translate_animals-status-died',
  sick: 'translate_animals-status-sick',
};

@Component({
  selector: 'app-animal-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, TranslatePipe],
  host: {
    class: 'block space-y-4 sm:space-y-6 px-2 sm:px-0',
  },
  template: `
    <section class="card-glass p-4 sm:p-6 rounded-xl sm:rounded-2xl">
      @if (loading()) {
        <p class="text-sm sm:text-base text-muted">
          {{ 'translate_animals-title' | translate }}...
        </p>
      } @else if (!animal()) {
        <p class="text-sm sm:text-base text-muted">{{ 'translate_animals-empty' | translate }}</p>
        <a routerLink="/animals" class="btn-ghost mt-2 inline-block text-xs px-3 py-2">
          ← {{ 'translate_animals-title' | translate }}
        </a>
      } @else {
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1
            class="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-50 min-w-0 truncate"
          >
            {{ 'translate_animals-detail-title' | translate }}
          </h1>
          <a routerLink="/animals" class="btn-ghost w-fit px-3 py-2 sm:px-4 sm:py-1.5 text-xs">
            ← {{ 'translate_animals-title' | translate }}
          </a>
        </div>

        <dl class="mt-4 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-3">
          <dt class="text-muted">{{ 'translate_animals-number' | translate }}</dt>
          <dd class="text-slate-900 dark:text-slate-50">{{ animal()!.number || '—' }}</dd>
          <dt class="text-muted">{{ 'translate_name' | translate }}</dt>
          <dd class="text-slate-900 dark:text-slate-50">{{ animal()!.name || '—' }}</dd>
          <dt class="text-muted">{{ 'translate_animals-identifier' | translate }}</dt>
          <dd class="text-slate-900 dark:text-slate-50">{{ animal()!.identifier || '—' }}</dd>
          <dt class="text-muted">{{ 'translate_animals-filter-species-label' | translate }}</dt>
          <dd class="text-slate-900 dark:text-slate-50">{{ speciesDisplayName() }}</dd>
          <dt class="text-muted">{{ 'translate_species-type' | translate }}</dt>
          <dd class="text-slate-900 dark:text-slate-50">{{ speciesTypeLabel() }}</dd>
          <dt class="text-muted">{{ 'translate_animals-reproduction-type' | translate }}</dt>
          <dd class="text-slate-900 dark:text-slate-50">{{ reproductionLabel() }}</dd>
          <dt class="text-muted">{{ 'translate_status' | translate }}</dt>
          <dd class="text-slate-900 dark:text-slate-50">{{ statusLabel() }}</dd>
          @if (isAnimalType()) {
            <dt class="text-muted">{{ 'translate_animals-birth-date' | translate }}</dt>
            <dd class="text-slate-900 dark:text-slate-50">
              {{ animal()?.birthDate?.toLocaleDateString() ?? '—' }}
            </dd>
            <dt class="text-muted">{{ 'translate_animals-age' | translate }}</dt>
            <dd class="text-slate-900 dark:text-slate-50">{{ ageDisplay() ?? '—' }}</dd>
          }
          @if (isBirdType()) {
            <dt class="text-muted">{{ 'translate_animals-egg-laying-date' | translate }}</dt>
            <dd class="text-slate-900 dark:text-slate-50">
              {{ animal()?.eggLayingDate?.toLocaleDateString() ?? '—' }}
            </dd>
            <dt class="text-muted">{{ 'translate_animals-hatching-date' | translate }}</dt>
            <dd class="text-slate-900 dark:text-slate-50">
              {{ animal()?.hatchingDate?.toLocaleDateString() ?? '—' }}
            </dd>
          }
          <dt class="text-muted">{{ 'translate_animals-vaccination-date' | translate }}</dt>
          <dd class="text-slate-900 dark:text-slate-50">
            {{ animal()?.vaccinationDate?.toLocaleDateString() ?? '—' }}
          </dd>
        </dl>
      }
    </section>

    @if (animal()) {
      <section class="card-glass p-4 sm:p-6 rounded-xl sm:rounded-2xl">
        <h2 class="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-50">
          {{ 'translate_animals-detail-comments' | translate }}
        </h2>

        @if (commentsLoading()) {
          <p class="mt-2 text-xs text-muted">...</p>
        } @else if (comments().length === 0) {
          <p class="mt-2 text-xs text-muted">
            {{ 'translate_animals-detail-comments-empty' | translate }}
          </p>
        } @else {
          <ul class="mt-3 space-y-2 sm:space-y-3">
            @for (c of comments(); track c.id) {
              <li
                class="rounded-lg sm:rounded-xl border border-slate-200/70 bg-white/40 p-2.5 sm:p-3 text-xs dark:border-white/10 dark:bg-slate-900/40"
              >
                <p class="text-muted">
                  {{ c.createdAt ? (c.createdAt | date: 'medium') : '' }}
                </p>
                <p class="mt-1 text-slate-900 dark:text-slate-50">{{ c.text }}</p>
                @if (c.type === 'medicine' && (c.medicineName || c.dose || c.nextDoseDate)) {
                  <p class="mt-2 text-muted">
                    @if (c.medicineName) {
                      <span
                        >{{ 'translate_animals-comment-medicine-name' | translate }}:
                        {{ c.medicineName }}</span
                      >
                    }
                    @if (c.dose) {
                      <span class="ms-2"
                        >{{ 'translate_animals-comment-dose' | translate }}: {{ c.dose }}</span
                      >
                    }
                    @if (c.nextDoseDate) {
                      <span class="ms-2"
                        >{{ 'translate_animals-comment-next-dose-date' | translate }}:
                        {{ c.nextDoseDate | date: 'shortDate' }}</span
                      >
                    }
                  </p>
                }
              </li>
            }
          </ul>
        }

        <form (submit)="onAddComment($event)" class="mt-4 space-y-3">
          <div>
            <label class="block text-[11px] font-semibold text-slate-900 dark:text-slate-50">
              {{ 'translate_animals-detail-add-comment' | translate }}
            </label>
            <textarea
              class="input-glass mt-1 w-full min-h-[4rem] text-xs"
              [placeholder]="'translate_animals-detail-add-comment' | translate"
              [value]="commentText()"
              (input)="commentText.set($any($event.target).value)"
              rows="3"
            ></textarea>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <span class="text-[11px] text-muted"
              >{{ 'translate_animals-comment-type-general' | translate }} /
              {{ 'translate_animals-comment-type-medicine' | translate }}</span
            >
            <select
              class="input-glass w-full sm:w-auto min-h-9 text-xs"
              [value]="commentType()"
              (change)="commentType.set($any($event.target).value)"
            >
              <option value="general">
                {{ 'translate_animals-comment-type-general' | translate }}
              </option>
              <option value="medicine">
                {{ 'translate_animals-comment-type-medicine' | translate }}
              </option>
            </select>
          </div>
          @if (commentType() === 'medicine') {
            <div class="grid gap-2 sm:grid-cols-3">
              <div>
                <label class="block text-[11px] text-muted">{{
                  'translate_animals-comment-medicine-name' | translate
                }}</label>
                <input
                  type="text"
                  class="input-glass w-full text-xs"
                  [value]="medicineName()"
                  (input)="medicineName.set($any($event.target).value)"
                />
              </div>
              <div>
                <label class="block text-[11px] text-muted">{{
                  'translate_animals-comment-dose' | translate
                }}</label>
                <input
                  type="text"
                  class="input-glass w-full text-xs"
                  [value]="medicineDose()"
                  (input)="medicineDose.set($any($event.target).value)"
                />
              </div>
              <div>
                <label class="block text-[11px] text-muted">{{
                  'translate_animals-comment-next-dose-date' | translate
                }}</label>
                <input
                  type="date"
                  class="input-glass w-full text-xs"
                  [value]="nextDoseDate()"
                  (input)="nextDoseDate.set($any($event.target).value)"
                />
              </div>
            </div>
          }
          <button
            type="submit"
            class="btn-primary w-full sm:w-auto px-4 py-2 sm:py-1.5 text-xs"
            [disabled]="!commentText().trim() || addingComment()"
          >
            {{ 'translate_animals-detail-add-comment' | translate }}
          </button>
        </form>
      </section>
    }
  `,
})
export class AnimalDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly animalsService = inject(AnimalsService);
  private readonly commentsService = inject(AnimalCommentsService);
  private readonly translation = inject(TranslationService);

  private readonly routeId = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')), {
    initialValue: '',
  });

  protected readonly animal = signal<AnimalWithSpecies | null>(null);
  protected readonly loading = signal(true);
  protected readonly comments = signal<AnimalComment[]>([]);
  protected readonly commentsLoading = signal(true);
  protected readonly commentText = signal('');
  protected readonly commentType = signal<AnimalCommentType>('general');
  protected readonly medicineName = signal('');
  protected readonly medicineDose = signal('');
  protected readonly nextDoseDate = signal('');
  protected readonly addingComment = signal(false);

  protected readonly statusLabel = computed(() => {
    const a = this.animal();
    if (!a) return '';
    return this.translation.instant(STATUS_KEYS[a.status] ?? a.status);
  });

  protected readonly speciesDisplayName = computed(() => {
    const a = this.animal();
    if (!a) return '—';
    return this.translation.currentLang() === 'ar' ? a.speciesNameAr : a.speciesNameEn;
  });

  protected readonly reproductionLabel = computed(() => {
    const a = this.animal();
    if (!a) return '—';
    const key =
      a.reproductionType === 'lays_egg'
        ? 'translate_animals-reproduction-lays-egg'
        : 'translate_animals-reproduction-gives-birth';
    return this.translation.instant(key);
  });

  protected readonly ageDisplay = computed(() => {
    const a = this.animal();
    if (!a) return null;
    return getAgeFromBirthDate(a.birthDate);
  });

  protected readonly isAnimalType = computed(() => {
    const a = this.animal();
    return a?.speciesType === 'animal';
  });

  protected readonly isBirdType = computed(() => {
    const a = this.animal();
    return a?.speciesType === 'bird';
  });

  protected readonly speciesTypeLabel = computed(() => {
    const a = this.animal();
    if (!a) return '—';
    return a.speciesType === 'bird'
      ? this.translation.instant('translate_species-type-bird')
      : this.translation.instant('translate_species-type-animal');
  });

  constructor() {
    effect(
      () => {
        const id = this.routeId();
        if (id) {
          void this.loadAnimal(id);
          void this.loadComments(id);
        }
      },
      { allowSignalWrites: true },
    );
  }

  private async loadAnimal(id: string): Promise<void> {
    this.loading.set(true);
    try {
      const a = await this.animalsService.getById(id);
      this.animal.set(a);
    } catch {
      this.animal.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadComments(animalId: string): Promise<void> {
    this.commentsLoading.set(true);
    try {
      const list = await this.commentsService.loadComments(animalId);
      this.comments.set(list);
    } catch {
      this.comments.set([]);
    } finally {
      this.commentsLoading.set(false);
    }
  }

  protected async onAddComment(event: Event): Promise<void> {
    event.preventDefault();
    const text = this.commentText().trim();
    if (!text || !this.animal()) return;
    this.addingComment.set(true);
    const type = this.commentType();
    const nextDate = this.nextDoseDate().trim() ? new Date(this.nextDoseDate()) : null;
    try {
      const newComment = await this.commentsService.addComment(this.animal()!.id, {
        text,
        type,
        medicineName: type === 'medicine' ? this.medicineName().trim() || null : null,
        dose: type === 'medicine' ? this.medicineDose().trim() || null : null,
        nextDoseDate: type === 'medicine' ? nextDate : null,
      });
      this.comments.update((list) => [newComment, ...list]);
      this.commentText.set('');
      this.medicineName.set('');
      this.medicineDose.set('');
      this.nextDoseDate.set('');
    } catch {
      // Error already shown via NotificationService in AnimalCommentsService
    } finally {
      this.addingComment.set(false);
    }
  }
}
