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
import {
  FormField,
  form,
  required,
  submit,
} from '@angular/forms/signals';
import { TranslatePipe } from '@ngx-translate/core';

import type { AnimalStatus } from '../../core/types/animal-status';
import { AnimalWithSpecies } from '../../core/types/animal';
import type { Species } from '../../core/types/species';
import { AnimalsService } from './services/animals.service';
import { TranslationService } from '../../core/services/translation.service';
import { UiButton } from '../../shared/ui/button/ui-button.component';

const STATUS_OPTIONS: { value: AnimalStatus; labelKey: string }[] = [
  { value: 'newborn', labelKey: 'translate_animals-status-newborn' },
  { value: 'gives_egg', labelKey: 'translate_animals-status-gives-egg' },
  { value: 'alive', labelKey: 'translate_animals-status-alive' },
  { value: 'died', labelKey: 'translate_animals-status-died' },
  { value: 'sick', labelKey: 'translate_animals-status-sick' },
];

interface AddAnimalModel {
  speciesId: string;
  name: string;
  identifier: string;
  status: AnimalStatus;
  birthDate: string;
  vaccinationDate: string;
}

@Component({
  selector: 'app-add-animal-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormField, TranslatePipe, UiButton],
  template: `
    @if (open()) {
      <div
        class="fixed inset-0 z-40 flex items-start sm:items-center justify-center overflow-y-auto bg-black/60 px-3 py-4 sm:px-4 sm:py-6 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="editingId() ? 'edit-animal-dialog-title' : 'add-animal-dialog-title'"
        (click)="onBackdropClick($event)"
        (keydown.escape)="onEscape()"
      >
        <div
          class="card-glass max-w-md w-full rounded-xl sm:rounded-2xl px-4 py-4 sm:px-5 sm:py-5 text-xs shadow-2xl my-auto max-h-[calc(100vh-2rem)] overflow-y-auto"
          (click)="$event.stopPropagation()"
        >
          <h2
            [id]="editingId() ? 'edit-animal-dialog-title' : 'add-animal-dialog-title'"
            class="text-sm font-semibold text-slate-900 dark:text-slate-50"
          >
            {{ (editingId() ? 'translate_animals-dialog-edit-title' : 'translate_animals-dialog-add-title') | translate }}
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
          <form (submit)="onSubmit($event)" class="mt-4 space-y-3">
            <div class="space-y-1">
              <label
                for="animal-species"
                class="block text-[11px] font-semibold text-slate-900 dark:text-slate-50"
              >
                {{ 'translate_animals-dialog-species-label' | translate }}
                <span class="text-red-400">*</span>
              </label>
              <select
                id="animal-species"
                class="input-glass min-h-10 w-full py-2 text-sm"
                [formField]="animalForm.speciesId"
              >
                <option value="">{{ 'translate_animals-dialog-species-placeholder' | translate }}</option>
                @for (s of speciesList(); track s.id) {
                  <option [value]="s.id">{{ speciesDisplayName(s) }}</option>
                }
              </select>
              @if (selectedSpecies()) {
                <p class="mt-1 text-[11px] text-muted">
                  {{ selectedSpecies()!.reproductionType === 'lays_egg' ? ('translate_animals-reproduction-lays-egg' | translate) : ('translate_animals-reproduction-gives-birth' | translate) }}
                </p>
              }
              @if (animalForm.speciesId().touched() && animalForm.speciesId().invalid()) {
                <p class="mt-0.5 text-[11px] text-red-400">
                  {{ animalForm.speciesId().errors()[0]?.message }}
                </p>
              }
            </div>

            <div class="space-y-1">
              <label
                for="animal-name"
                class="block text-[11px] font-semibold text-slate-900 dark:text-slate-50"
              >
                {{ 'translate_name' | translate }}
              </label>
              <input
                id="animal-name"
                type="text"
                class="input-glass w-full text-xs"
                [attr.placeholder]="'translate_animals-dialog-name-placeholder' | translate"
                [formField]="animalForm.name"
              />
            </div>

            <div class="space-y-1">
              <label
                for="animal-identifier"
                class="block text-[11px] font-semibold text-slate-900 dark:text-slate-50"
              >
                {{ 'translate_animals-identifier' | translate }}
              </label>
              <input
                id="animal-identifier"
                type="text"
                class="input-glass w-full text-xs"
                [attr.placeholder]="'translate_animals-dialog-identifier-placeholder' | translate"
                [formField]="animalForm.identifier"
              />
            </div>

            <div class="space-y-1">
              <label
                for="animal-status"
                class="block text-[11px] font-semibold text-slate-900 dark:text-slate-50"
              >
                {{ 'translate_status' | translate }}
                <span class="text-red-400">*</span>
              </label>
              <select
                id="animal-status"
                class="input-glass min-h-10 w-full py-2 text-sm"
                [formField]="animalForm.status"
              >
                <option value="">{{ 'translate_animals-dialog-status-placeholder' | translate }}</option>
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

            <div class="space-y-2">
              <span class="block text-[11px] font-semibold text-slate-900 dark:text-slate-50">
                {{ 'translate_animals-age' | translate }} / {{ 'translate_animals-birth-date' | translate }}
              </span>
              <div class="flex gap-2">
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
                <div class="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    class="input-glass w-24 py-2 text-sm"
                    [placeholder]="'translate_animals-age' | translate"
                    [value]="ageValue()"
                    (input)="ageValue.set($any($event.target).valueAsNumber || 0)"
                  />
                  <select
                    class="input-glass min-h-10 flex-1 py-2 text-sm"
                    [value]="ageUnit()"
                    (change)="ageUnit.set($any($event.target).value)"
                  >
                    <option value="days">{{ 'translate_animals-age-days' | translate }}</option>
                    <option value="months">{{ 'translate_animals-age-months' | translate }}</option>
                    <option value="years">{{ 'translate_animals-age-years' | translate }}</option>
                  </select>
                </div>
              } @else {
                <input
                  id="animal-birthDate"
                  type="date"
                  class="input-glass w-full py-2 text-sm"
                  [formField]="animalForm.birthDate"
                />
                @if (animalForm.birthDate().touched() && animalForm.birthDate().invalid()) {
                  <p class="mt-0.5 text-[11px] text-red-400">
                    {{ animalForm.birthDate().errors()[0]?.message }}
                  </p>
                }
              }
            </div>

            <div class="space-y-1">
              <label
                for="animal-vaccinationDate"
                class="block text-[11px] font-semibold text-slate-900 dark:text-slate-50"
              >
                {{ 'translate_animals-vaccination-date' | translate }}
              </label>
              <input
                id="animal-vaccinationDate"
                type="date"
                class="input-glass w-full text-xs"
                [formField]="animalForm.vaccinationDate"
              />
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
                    <span class="h-3 w-3 animate-spin rounded-full border border-slate-900 dark:border-slate-50 border-t-transparent"></span>
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
    speciesId: '',
    name: '',
    identifier: '',
    status: 'alive',
    birthDate: '',
    vaccinationDate: '',
  });

  private readonly translation = inject(TranslationService);
  private readonly animalsService = inject(AnimalsService);

  protected readonly animalForm = form(this.model, (schemaPath) => {
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

  constructor() {
    effect(() => {
      const a = this.animal();
      if (a) {
        this.editingId.set(a.id);
        this.useAgeInput.set(false);
        this.model.set({
          speciesId: a.speciesId,
          name: a.name ?? '',
          identifier: a.identifier ?? '',
          status: a.status,
          birthDate: a.birthDate ? this.formatDateForInput(a.birthDate) : '',
          vaccinationDate: a.vaccinationDate ? this.formatDateForInput(a.vaccinationDate) : '',
        });
      } else {
        this.editingId.set(null);
        this.useAgeInput.set(true);
        this.ageValue.set(0);
        this.ageUnit.set('months');
        this.model.set({
          speciesId: '',
          name: '',
          identifier: '',
          status: 'alive',
          birthDate: '',
          vaccinationDate: '',
        });
      }
    });
  }

  protected speciesDisplayName(s: Species): string {
    return this.translation.currentLang() === 'ar' ? s.nameAr : s.nameEn;
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

    let birthDate: Date | null;
    if (this.useAgeInput()) {
      birthDate = this.birthDateFromAge();
    } else {
      birthDate = this.model().birthDate
        ? new Date(this.model().birthDate)
        : null;
    }
    const vaccinationDate = this.model().vaccinationDate
      ? new Date(this.model().vaccinationDate)
      : null;
    if (birthDate && birthDate > new Date()) {
      this.formError.set(this.translation.instant('translate_animals-validation-birth-date-future'));
      return;
    }

    const editingId = this.editingId();
    await submit(this.animalForm, async () => {
      this.submitting.set(true);
      try {
        const { speciesId, name, identifier, status } = this.model();
        if (editingId) {
          await this.animalsService.update(editingId, {
            speciesId,
            name: name.trim() || null,
            identifier: identifier.trim() || null,
            status,
            birthDate,
            vaccinationDate,
          });
        } else {
          await this.animalsService.add({
            speciesId,
            name: name.trim() || null,
            identifier: identifier.trim() || null,
            status,
            birthDate,
            vaccinationDate,
          });
        }
        this.saved.emit();
        this.closed.emit();
      } catch {
        this.formError.set(
          this.translation.instant(editingId ? 'translate_animals-error-update' : 'translate_animals-error-create'),
        );
      } finally {
        this.submitting.set(false);
      }
    });
  }
}
