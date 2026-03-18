import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
  effect,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormField, form, required, submit } from '@angular/forms/signals';
import { TranslatePipe } from '@ngx-translate/core';

import type { AnimalStatus } from '../../core/types/animal-status';
import { AnimalWithSpecies } from '../../core/types/animal';
import type { Species } from '../../core/types/species';
import { AnimalsService } from './services/animals.service';
import { AnimalCommentsService } from './services/animal-comments.service';
import { TranslationService } from '../../core/services/translation.service';
import { UiButton } from '../../shared/ui/button/ui-button.component';
import { SpeciesDisplayNamePipe } from '../../shared/pipes/species-display-name.pipe';

const STATUS_OPTIONS: { value: AnimalStatus; labelKey: string }[] = [
  { value: 'newborn', labelKey: 'translate_animals-status-newborn' },
  { value: 'gives_egg', labelKey: 'translate_animals-status-gives-egg' },
  { value: 'alive', labelKey: 'translate_animals-status-alive' },
  { value: 'died', labelKey: 'translate_animals-status-died' },
  { value: 'sick', labelKey: 'translate_animals-status-sick' },
];

interface AddAnimalModel {
  number: string;
  speciesId: string;
  name: string;
  identifier: string;
  status: AnimalStatus;
  birthDate: string;
  eggLayingDate: string;
  hatchingDate: string;
  vaccinationDate: string;
}

interface VaccinationEntry {
  id: string;
  name: string;
  date: string;
}

@Component({
  selector: 'app-add-animal-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormField, TranslatePipe, UiButton, SpeciesDisplayNamePipe],
  template: `
    @if (open()) {
      <div
        class="fixed inset-0 z-40 flex items-start sm:items-center justify-center overflow-y-auto bg-black/60 px-3 py-4 sm:px-4 sm:py-6 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="
          editingId() ? 'edit-animal-dialog-title' : 'add-animal-dialog-title'
        "
        (click)="onBackdropClick($event)"
        (keydown.escape)="onEscape()"
      >
        <div
          class="card-glass max-w-md w-full min-w-0 rounded-xl sm:rounded-2xl px-4 py-4 sm:px-5 sm:py-5 text-xs shadow-2xl my-auto max-h-[calc(100vh-2rem)] overflow-y-auto"
          (click)="$event.stopPropagation()"
        >
          <h2
            [id]="editingId() ? 'edit-animal-dialog-title' : 'add-animal-dialog-title'"
            class="text-sm font-semibold text-slate-900 dark:text-slate-50"
          >
            {{
              (editingId()
                ? 'translate_animals-dialog-edit-title'
                : 'translate_animals-dialog-add-title'
              ) | translate
            }}
          </h2>

          @if (speciesList().length === 0) {
            <p class="mt-4 text-sm text-muted">
              {{ 'translate_animals-species-empty' | translate }}
            </p>
            <div class="mt-4 flex justify-end">
              <app-ui-button
                variant="ghost"
                size="sm"
                labelKey="translate_cancel"
                (click)="onCancel()"
              />
            </div>
          } @else {
            <form (submit)="onSubmit($event)" class="mt-4 space-y-3 min-w-0">
              <div class="space-y-1 min-w-0">
                <label
                  for="animal-number"
                  class="block text-[11px] font-semibold text-slate-900 dark:text-slate-50"
                >
                  {{ 'translate_animals-number' | translate }}
                  <span class="text-red-400">*</span>
                </label>
                <input
                  id="animal-number"
                  type="text"
                  class="input-glass w-full min-w-0 max-w-full text-xs"
                  [attr.placeholder]="'translate_animals-number-placeholder' | translate"
                  [formField]="animalForm.number"
                />
                @if (animalForm.number().touched() && animalForm.number().invalid()) {
                  <p class="mt-0.5 text-[11px] text-red-400">
                    {{ animalForm.number().errors()[0]?.message }}
                  </p>
                }
              </div>

              <div class="space-y-1 min-w-0">
                <label
                  for="animal-species"
                  class="block text-[11px] font-semibold text-slate-900 dark:text-slate-50"
                >
                  {{ 'translate_animals-dialog-species-label' | translate }}
                  <span class="text-red-400">*</span>
                </label>
                <select
                  id="animal-species"
                  class="input-glass min-h-10 w-full min-w-0 max-w-full py-2 text-sm"
                  [formField]="animalForm.speciesId"
                >
                  <option value="">
                    {{ 'translate_animals-dialog-species-placeholder' | translate }}
                  </option>
                  @for (s of speciesList(); track s.id) {
                    <option [value]="s.id">{{ s | speciesDisplayName: currentLang() }}</option>
                  }
                </select>
                @if (selectedSpecies()) {
                  <p class="mt-1 text-[11px] text-muted">
                    {{
                      selectedSpecies()!.reproductionType === 'lays_egg'
                        ? ('translate_animals-reproduction-lays-egg' | translate)
                        : ('translate_animals-reproduction-gives-birth' | translate)
                    }}
                    @if (isBirdType()) {
                      <span class="ml-1 text-green-600 dark:text-green-400"
                        >({{ 'translate_species-type-bird' | translate }})</span
                      >
                    }
                    @if (isAnimalType()) {
                      <span class="ml-1 text-blue-600 dark:text-blue-400"
                        >({{ 'translate_species-type-animal' | translate }})</span
                      >
                    }
                  </p>
                }
                @if (animalForm.speciesId().touched() && animalForm.speciesId().invalid()) {
                  <p class="mt-0.5 text-[11px] text-red-400">
                    {{ animalForm.speciesId().errors()[0]?.message }}
                  </p>
                }
              </div>

              <div class="space-y-1 min-w-0">
                <label
                  for="animal-name"
                  class="block text-[11px] font-semibold text-slate-900 dark:text-slate-50"
                >
                  {{ 'translate_name' | translate }}
                </label>
                <input
                  id="animal-name"
                  type="text"
                  class="input-glass w-full min-w-0 max-w-full text-xs"
                  [attr.placeholder]="'translate_animals-dialog-name-placeholder' | translate"
                  [formField]="animalForm.name"
                />
              </div>

              <div class="space-y-1 min-w-0">
                <label
                  for="animal-identifier"
                  class="block text-[11px] font-semibold text-slate-900 dark:text-slate-50"
                >
                  {{ 'translate_animals-identifier' | translate }}
                </label>
                <input
                  id="animal-identifier"
                  type="text"
                  class="input-glass w-full min-w-0 max-w-full text-xs"
                  [attr.placeholder]="'translate_animals-dialog-identifier-placeholder' | translate"
                  [formField]="animalForm.identifier"
                />
              </div>

              <div class="space-y-1 min-w-0">
                <label
                  for="animal-status"
                  class="block text-[11px] font-semibold text-slate-900 dark:text-slate-50"
                >
                  {{ 'translate_status' | translate }}
                  <span class="text-red-400">*</span>
                </label>
                <select
                  id="animal-status"
                  class="input-glass min-h-10 w-full min-w-0 max-w-full py-2 text-sm"
                  [formField]="animalForm.status"
                >
                  <option value="">
                    {{ 'translate_animals-dialog-status-placeholder' | translate }}
                  </option>
                  @for (opt of statusOptions; track opt.value) {
                    <option [value]="opt.value">{{ opt.labelKey | translate }}</option>
                  }
                </select>
                @if (animalForm.status().touched() && animalForm.status().invalid()) {
                  <p class="mt-0.5 text-[11px] text-red-400">
                    {{ animalForm.status().errors()[0]?.message }}
                  </p>
                }
              </div>

              <div class="space-y-2 min-w-0">
                <span class="block text-[11px] font-semibold text-slate-900 dark:text-slate-50">
                  @if (isAnimalType()) {
                    {{ 'translate_animals-birth-date' | translate }}
                  }
                  @if (isBirdType()) {
                    {{ 'translate_animals-egg-laying-date' | translate }}
                    <span class="text-muted font-normal">
                      / {{ 'translate_animals-hatching-date' | translate }}</span
                    >
                  }
                </span>
                @if (isAnimalType()) {
                  <div class="flex flex-wrap gap-2">
                    <button
                      type="button"
                      class="rounded-lg px-3 py-1.5 text-xs transition-colors"
                      [class.btn-primary]="useAgeInput()"
                      [class.btn-ghost]="!useAgeInput()"
                      (click)="useAgeInput.set(true)"
                    >
                      {{ 'translate_animals-dialog-use-age' | translate }}
                    </button>
                    <button
                      type="button"
                      class="rounded-lg px-3 py-1.5 text-xs transition-colors"
                      [class.btn-primary]="!useAgeInput()"
                      [class.btn-ghost]="useAgeInput()"
                      (click)="useAgeInput.set(false)"
                    >
                      {{ 'translate_animals-dialog-use-birth-date' | translate }}
                    </button>
                  </div>
                  @if (useAgeInput()) {
                    <div class="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                      <input
                        type="number"
                        min="0"
                        class="input-glass w-full min-w-0 py-2 text-sm sm:w-24 sm:min-w-[6rem]"
                        [placeholder]="'translate_animals-age' | translate"
                        [value]="ageValue()"
                        (input)="ageValue.set($any($event.target).valueAsNumber || 0)"
                      />
                      <select
                        class="input-glass min-h-10 w-full min-w-0 max-w-full py-2 text-sm sm:max-w-none"
                        [value]="ageUnit()"
                        (change)="ageUnit.set($any($event.target).value)"
                      >
                        <option value="days">{{ 'translate_animals-age-days' | translate }}</option>
                        <option value="months">
                          {{ 'translate_animals-age-months' | translate }}
                        </option>
                        <option value="years">
                          {{ 'translate_animals-age-years' | translate }}
                        </option>
                      </select>
                    </div>
                  } @else {
                    <input
                      id="animal-birthDate"
                      type="date"
                      class="input-glass w-full min-w-0 max-w-full py-2 text-sm"
                      [formField]="animalForm.birthDate"
                    />
                    @if (animalForm.birthDate().touched() && animalForm.birthDate().invalid()) {
                      <p class="mt-0.5 text-[11px] text-red-400">
                        {{ animalForm.birthDate().errors()[0]?.message }}
                      </p>
                    }
                  }
                }
                @if (isBirdType()) {
                  <input
                    id="animal-eggLayingDate"
                    type="date"
                    class="input-glass w-full min-w-0 max-w-full py-2 text-sm"
                    [formField]="animalForm.eggLayingDate"
                  />
                  <input
                    id="animal-hatchingDate"
                    type="date"
                    class="input-glass w-full min-w-0 max-w-full py-2 text-sm"
                    [attr.placeholder]="'translate_animals-hatching-date' | translate"
                    [formField]="animalForm.hatchingDate"
                  />
                }
              </div>

              <div class="space-y-2 min-w-0">
                <span class="block text-[11px] font-semibold text-slate-900 dark:text-slate-50">
                  {{ 'translate_animals-dialog-vaccinations-label' | translate }}
                </span>
                @for (v of vaccinations(); track v.id) {
                  <div
                    class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 border-b border-slate-200/50 dark:border-white/10 pb-2"
                  >
                    <input
                      type="text"
                      class="input-glass w-full min-w-0 max-w-full py-2 text-sm"
                      [placeholder]="'translate_animals-vaccination-name' | translate"
                      [value]="v.name"
                      (input)="updateVaccinationName(v.id, $any($event.target).value)"
                    />
                    <input
                      type="date"
                      class="input-glass w-full min-w-0 max-w-full py-2 text-sm sm:w-36"
                      [value]="v.date"
                      (input)="updateVaccinationDate(v.id, $any($event.target).value)"
                    />
                    <button
                      type="button"
                      class="btn-ghost shrink-0 px-2 py-1 text-[11px] rounded-full"
                      (click)="removeVaccination(v.id)"
                      [attr.aria-label]="'translate_animals-dialog-remove-vaccination' | translate"
                    >
                      {{ 'translate_animals-dialog-remove-vaccination' | translate }}
                    </button>
                  </div>
                }
                <button
                  type="button"
                  class="btn-ghost inline-flex items-center rounded-full px-2.5 py-1 text-[11px]"
                  (click)="addVaccination()"
                >
                  {{ 'translate_animals-dialog-add-vaccination' | translate }}
                </button>
              </div>

              <div class="space-y-2 min-w-0">
                <span class="block text-[11px] font-semibold text-slate-900 dark:text-slate-50">
                  {{ 'translate_animals-dialog-comments-section-label' | translate }}
                </span>
                @for (c of newComments(); track $index) {
                  <div class="flex gap-2">
                    <textarea
                      class="input-glass w-full min-w-0 max-w-full py-2 text-sm resize-y min-h-[4rem]"
                      [placeholder]="'translate_animals-dialog-comment-placeholder' | translate"
                      [value]="c"
                      (input)="updateComment($index, $any($event.target).value)"
                      rows="2"
                    ></textarea>
                    @if (newComments().length > 1) {
                      <button
                        type="button"
                        class="btn-ghost shrink-0 px-2 py-1 text-[11px] rounded-full self-start"
                        (click)="removeComment($index)"
                        [attr.aria-label]="
                          'translate_animals-dialog-remove-vaccination' | translate
                        "
                      >
                        {{ 'translate_animals-dialog-remove-vaccination' | translate }}
                      </button>
                    }
                  </div>
                }
                <button
                  type="button"
                  class="btn-ghost inline-flex items-center rounded-full px-2.5 py-1 text-[11px]"
                  (click)="addComment()"
                >
                  {{ 'translate_animals-dialog-add-comment-entry' | translate }}
                </button>
              </div>

              @if (formError()) {
                <p class="rounded-xl bg-red-500/10 px-3 py-2 text-[11px] text-red-400">
                  {{ formError() }}
                </p>
              }

              <div class="mt-4 flex justify-end gap-2">
                <app-ui-button
                  variant="ghost"
                  size="sm"
                  labelKey="translate_cancel"
                  [disabled]="submitting()"
                  (click)="onCancel()"
                />
                <button
                  type="submit"
                  class="btn-primary inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs"
                  [disabled]="animalForm().invalid() || submitting()"
                >
                  @if (submitting()) {
                    <span class="inline-flex items-center gap-2">
                      <span
                        class="h-3 w-3 animate-spin rounded-full border border-slate-900 dark:border-slate-50 border-t-transparent"
                      ></span>
                      <span>{{ 'translate_animals-dialog-save' | translate }}</span>
                    </span>
                  } @else {
                    <span>{{ 'translate_animals-dialog-save' | translate }}</span>
                  }
                </button>
              </div>
            </form>
          }
        </div>
      </div>
    }
  `,
})
export class AddAnimalDialogComponent {
  readonly open = input(false);
  readonly speciesList = input<Species[]>([]);
  readonly animal = input<AnimalWithSpecies | null>(null);
  readonly saved = output<void>();
  readonly closed = output<void>();

  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly model = signal<AddAnimalModel>({
    number: '',
    speciesId: '',
    name: '',
    identifier: '',
    status: 'alive',
    birthDate: '',
    eggLayingDate: '',
    hatchingDate: '',
    vaccinationDate: '',
  });

  /** Dynamic vaccination entries (name + date). */
  protected readonly vaccinations = signal<VaccinationEntry[]>([]);
  /** New comment texts to save (date/time and "by" set when saving). */
  protected readonly newComments = signal<string[]>(['']);

  private readonly translation = inject(TranslationService);
  private readonly animalsService = inject(AnimalsService);
  private readonly animalCommentsService = inject(AnimalCommentsService);

  private nextVaccinationId = 0;

  protected readonly animalForm = form(this.model, (schemaPath) => {
    required(schemaPath.number, {
      message: this.translation.instant('translate_animals-validation-number-required'),
    });
    required(schemaPath.speciesId, {
      message: this.translation.instant('translate_animals-validation-species-required'),
    });
    required(schemaPath.status, {
      message: this.translation.instant('translate_animals-validation-status-required'),
    });
  });

  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly editingId = signal<string | null>(null);

  /** When true, show age (number + unit) and compute birth date from it. When false, show birth date input. */
  protected readonly useAgeInput = signal(true);
  protected readonly ageValue = signal<number>(0);
  protected readonly ageUnit = signal<'days' | 'months' | 'years'>('months');

  protected readonly selectedSpecies = computed(() => {
    const id = this.model().speciesId;
    return this.speciesList().find((s) => s.id === id) ?? null;
  });

  protected readonly currentLang = computed(() => this.translation.currentLang());

  protected readonly isAnimalType = computed(() => this.selectedSpecies()?.type === 'animal');

  protected readonly isBirdType = computed(() => this.selectedSpecies()?.type === 'bird');

  constructor() {
    effect(() => {
      const a = this.animal();
      if (a) {
        this.editingId.set(a.id);
        this.useAgeInput.set(false);
        this.model.set({
          number: a.number ?? '',
          speciesId: a.speciesId,
          name: a.name ?? '',
          identifier: a.identifier ?? '',
          status: a.status,
          birthDate: a.birthDate ? this.formatDateForInput(a.birthDate) : '',
          eggLayingDate: a.eggLayingDate ? this.formatDateForInput(a.eggLayingDate) : '',
          hatchingDate: a.hatchingDate ? this.formatDateForInput(a.hatchingDate) : '',
          vaccinationDate: a.vaccinationDate ? this.formatDateForInput(a.vaccinationDate) : '',
        });
        const vacc = a.vaccinations?.length
          ? a.vaccinations.map((v) => ({
              id: `v-${this.nextVaccinationId++}`,
              name: v.name,
              date: this.formatDateForInput(v.date),
            }))
          : [];
        if (vacc.length === 0 && a.vaccinationDate) {
          vacc.push({
            id: `v-${this.nextVaccinationId++}`,
            name: '',
            date: this.formatDateForInput(a.vaccinationDate),
          });
        }
        this.vaccinations.set(
          vacc.length ? vacc : [{ id: `v-${this.nextVaccinationId++}`, name: '', date: '' }],
        );
        this.newComments.set(['']);
      } else {
        this.editingId.set(null);
        this.useAgeInput.set(true);
        this.ageValue.set(0);
        this.ageUnit.set('months');
        this.model.set({
          number: '',
          speciesId: '',
          name: '',
          identifier: '',
          status: 'alive',
          birthDate: '',
          eggLayingDate: '',
          hatchingDate: '',
          vaccinationDate: '',
        });
        this.vaccinations.set([{ id: `v-${this.nextVaccinationId++}`, name: '', date: '' }]);
        this.newComments.set(['']);
      }
    });
  }

  protected addVaccination(): void {
    this.vaccinations.update((list) => [
      ...list,
      { id: `v-${this.nextVaccinationId++}`, name: '', date: '' },
    ]);
  }

  protected removeVaccination(id: string): void {
    this.vaccinations.update((list) => list.filter((v) => v.id !== id));
  }

  protected updateVaccinationName(id: string, name: string): void {
    this.vaccinations.update((list) => list.map((v) => (v.id === id ? { ...v, name } : v)));
  }

  protected updateVaccinationDate(id: string, date: string): void {
    this.vaccinations.update((list) => list.map((v) => (v.id === id ? { ...v, date } : v)));
  }

  protected addComment(): void {
    this.newComments.update((list) => [...list, '']);
  }

  protected removeComment(index: number): void {
    this.newComments.update((list) => list.filter((_, i) => i !== index));
  }

  protected updateComment(index: number, value: string): void {
    this.newComments.update((list) => list.map((c, i) => (i === index ? value : c)));
  }

  private formatDateForInput(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  protected onEscape(): void {
    if (this.open() && !this.submitting()) {
      this.closed.emit();
    }
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget && !this.submitting()) {
      this.closed.emit();
    }
  }

  protected onCancel(): void {
    if (!this.submitting()) {
      this.closed.emit();
    }
  }

  /** Computes birth date from current date minus age (value + unit). */
  private birthDateFromAge(): Date | null {
    const val = this.ageValue();
    if (val <= 0) return null;
    const now = new Date();
    const unit = this.ageUnit();
    if (unit === 'days') {
      return new Date(now.getTime() - val * 24 * 60 * 60 * 1000);
    }
    if (unit === 'months') {
      const d = new Date(now);
      d.setMonth(d.getMonth() - val);
      return d;
    }
    const d = new Date(now);
    d.setFullYear(d.getFullYear() - val);
    return d;
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.formError.set(null);

    const species = this.selectedSpecies();
    let birthDate: Date | null = null;
    if (species?.type === 'animal') {
      if (this.useAgeInput()) {
        birthDate = this.birthDateFromAge();
      } else {
        birthDate = this.model().birthDate ? new Date(this.model().birthDate) : null;
      }
    }
    const eggLayingDate =
      species?.type === 'bird' && this.model().eggLayingDate
        ? new Date(this.model().eggLayingDate)
        : null;
    const hatchingDate =
      species?.type === 'bird' && this.model().hatchingDate
        ? new Date(this.model().hatchingDate)
        : null;

    if (birthDate && birthDate > new Date()) {
      this.formError.set(
        this.translation.instant('translate_animals-validation-birth-date-future'),
      );
      return;
    }
    if (eggLayingDate && hatchingDate && hatchingDate <= eggLayingDate) {
      this.formError.set(
        this.translation.instant('translate_animals-validation-hatching-after-egg'),
      );
      return;
    }

    const vaccinationEntries = this.vaccinations().filter((v) => v.name.trim() || v.date);
    const vaccinationsDto =
      vaccinationEntries.length > 0
        ? vaccinationEntries.map((v) => ({
            name: v.name.trim() || '—',
            date: v.date ? new Date(v.date) : new Date(),
          }))
        : undefined;
    const lastVaccDate = vaccinationsDto?.length
      ? vaccinationsDto[vaccinationsDto.length - 1].date
      : null;

    const editingId = this.editingId();
    const commentsToAdd = this.newComments()
      .map((t) => t.trim())
      .filter(Boolean);
    await submit(this.animalForm, async () => {
      this.submitting.set(true);
      try {
        const { number, speciesId, name, identifier, status } = this.model();
        let animalId: string;
        if (editingId) {
          await this.animalsService.update(editingId, {
            number,
            speciesId,
            name: name.trim() || null,
            identifier: identifier.trim() || null,
            status,
            birthDate,
            eggLayingDate,
            hatchingDate,
            vaccinationDate: lastVaccDate,
            vaccinations: vaccinationsDto,
          });
          animalId = editingId;
        } else {
          const created = await this.animalsService.add({
            number,
            speciesId,
            name: name.trim() || null,
            identifier: identifier.trim() || null,
            status,
            birthDate,
            eggLayingDate,
            hatchingDate,
            vaccinationDate: lastVaccDate,
            vaccinations: vaccinationsDto,
          });
          animalId = created.id;
        }
        for (const text of commentsToAdd) {
          await this.animalCommentsService.addComment(animalId, {
            text,
            type: 'general',
          });
        }
        this.saved.emit();
        this.closed.emit();
      } catch {
        // Error already shown via NotificationService in AnimalsService / AnimalCommentsService
      } finally {
        this.submitting.set(false);
      }
    });
  }
}
