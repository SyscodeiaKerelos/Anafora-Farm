import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormField, form, required, submit } from '@angular/forms/signals';
import { TranslatePipe } from '@ngx-translate/core';

import type { SpeciesType } from '../../../core/types/species';
import { SpeciesService } from '../services/species.service';
import { TranslationService } from '../../../core/services/translation.service';

interface AddSpeciesModel {
  name: string;
  type: SpeciesType;
}

const TYPE_OPTIONS: { value: SpeciesType; labelKey: string }[] = [
  { value: 'bird', labelKey: 'translate_species-type-bird' },
  { value: 'animal', labelKey: 'translate_species-type-animal' },
];

@Component({
  selector: 'app-add-species-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormField, TranslatePipe],
  host: {
    class: 'block space-y-4 sm:space-y-6 px-2 sm:px-0',
  },
  template: `
    <div class="max-w-md mx-auto">
      <div class="card-glass rounded-2xl px-4 py-5 sm:px-6 sm:py-6">
        <h1 class="text-base font-semibold text-slate-900 dark:text-slate-50">
          {{ 'translate_species-add-title' | translate }}
        </h1>
        <p class="mt-1 text-xs text-muted">
          {{ 'translate_species-add-subtitle' | translate }}
        </p>

        <form (submit)="onSubmit($event)" class="mt-5 space-y-4">
          <div class="space-y-1">
            <label
              for="species-name"
              class="block text-xs font-semibold text-slate-900 dark:text-slate-50"
            >
              {{ 'translate_name' | translate }}
              <span class="text-red-400">*</span>
            </label>
            <input
              id="species-name"
              type="text"
              class="input-glass w-full min-w-0 max-w-full text-xs"
              [attr.placeholder]="'translate_species-name-placeholder' | translate"
              [formField]="speciesForm.name"
            />
            @if (speciesForm.name().touched() && speciesForm.name().invalid()) {
              <p class="mt-0.5 text-[11px] text-red-400">
                {{ speciesForm.name().errors()[0]?.message }}
              </p>
            }
          </div>

          <div class="space-y-1">
            <label
              for="species-type"
              class="block text-xs font-semibold text-slate-900 dark:text-slate-50"
            >
              {{ 'translate_species-type' | translate }}
              <span class="text-red-400">*</span>
            </label>
            <select
              id="species-type"
              class="input-glass min-h-10 w-full min-w-0 max-w-full py-2 text-xs"
              [formField]="speciesForm.type"
            >
              <option value="">
                {{ 'translate_species-type-placeholder' | translate }}
              </option>
              @for (opt of typeOptions; track opt.value) {
                <option [value]="opt.value">{{ opt.labelKey | translate }}</option>
              }
            </select>
            @if (speciesForm.type().touched() && speciesForm.type().invalid()) {
              <p class="mt-0.5 text-[11px] text-red-400">
                {{ speciesForm.type().errors()[0]?.message }}
              </p>
            }
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              class="btn-ghost inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs"
              [disabled]="submitting()"
              (click)="onReset()"
            >
              {{ 'translate_reset' | translate }}
            </button>
            <button
              type="submit"
              class="btn-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs"
              [disabled]="speciesForm().invalid() || submitting()"
            >
              @if (submitting()) {
                <span class="inline-flex items-center gap-2">
                  <span
                    class="h-3 w-3 animate-spin rounded-full border border-slate-900 dark:border-slate-50 border-t-transparent"
                  ></span>
                  <span>{{ 'translate_saving' | translate }}</span>
                </span>
              } @else {
                <span>{{ 'translate_save' | translate }}</span>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class AddSpeciesPage {
  protected readonly typeOptions = TYPE_OPTIONS;

  private readonly speciesService = inject(SpeciesService);
  private readonly translation = inject(TranslationService);

  protected readonly model = signal<AddSpeciesModel>({
    name: '',
    type: '' as SpeciesType,
  });

  protected readonly speciesForm = form(this.model, (schemaPath) => {
    required(schemaPath.name, {
      message: this.translation.instant('translate_species-validation-name-required'),
    });
    required(schemaPath.type, {
      message: this.translation.instant('translate_species-validation-type-required'),
    });
  });

  protected readonly submitting = signal(false);

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    await submit(this.speciesForm, async () => {
      this.submitting.set(true);
      try {
        await this.speciesService.addSpecies(this.model());
        this.onReset();
      } catch {
      } finally {
        this.submitting.set(false);
      }
    });
  }

  protected onReset(): void {
    this.model.set({
      name: '',
      type: '' as SpeciesType,
    });
  }
}
