const fs = require('fs');

const content = `import {
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
  template: \`
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
          class="card-glass max-w-lg w-full min-w-0 rounded-xl sm:rounded-2xl px-4 py-4 sm:px-5 sm:py-5 text-xs shadow-2xl my-auto max-h-[calc(100vh-2rem)] overflow-y-auto"
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
          <form (submit)="onSubmit($event)" class="mt-4 space-y-3 min-w-0">
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
                <option value="">{{ 'translate_animals-dialog-species-placeholder' | translate }}</option>
                @for (s of speciesList(); track s.id) {
                  <option [value]="s.id">{{ s | speciesDisplayName : currentLang() }}</option>
                }
              </select>
              @if (selectedSpecies()) {
                <p class="mt-1 text-[11px] text-muted">
                  <span class="inline-flex items-center gap-1">
                    <span [class]="selectedSpecies()!.type === 'bird' ? 'text-amber-500' : 'text-green-500'">
                      {{ selectedSpecies()!.type === 'bird' ? ('translate_species-type-bird' | translate) : ('translate_species-type-animal' | translate) }}
                    </span>
                    <span class="mx-1">·</span>
                    <span>
                      {{ selectedSpecies()!.reproductionType === 'lays_egg' ? ('translate_animals-reproduction-lays-egg' | translate) : ('translate_animals-reproduction-gives-birth' | translate) }}
                    </span>
                  </span>
                </p>
              }
              @if (animalForm.speciesId().touched && animalForm.speciesId().invalid()) {
                <p class="mt-0.5 text-[11px] text-red-400">
                  {{ animalForm.speciesId().errors()[0]?.message }}
                </p>
              }
            </div>

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
              @if (animalForm.number().touched && animalForm.number().invalid()) {
                <p class="mt-0.5 text-[11px] text-red-400">
                  {{ animalForm.number().errors()[0]?.message }}
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
                <option value="">{{ 'translate_animals-dialog-status-placeholder' | translate }
