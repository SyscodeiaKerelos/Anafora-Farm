import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { AnimalWithSpecies } from '../../core/types/animal';
import type { AnimalStatus } from '../../core/types/animal-status';
import { Species } from '../../core/types/species';
import { getAgeFromBirthDate } from '../../core/utils/age.util';
import { AnimalsService } from './services/animals.service';
import { SpeciesService } from './services/species.service';
import { TranslationService } from '../../core/services/translation.service';
import {
  UiDataTable,
  type ColumnConfig,
  type FilterConfig,
  type TableRowActionEvent,
} from '../../shared/ui/table/ui-data-table.component';
import {
  AddAnimalDialogComponent,
  SpeciesSectionComponent,
} from './components.index';

const STATUS_KEYS: Record<AnimalStatus, string> = {
  newborn: 'translate_animals-status-newborn',
  gives_egg: 'translate_animals-status-gives-egg',
  alive: 'translate_animals-status-alive',
  died: 'translate_animals-status-died',
  sick: 'translate_animals-status-sick',
};

/** Row type for the table with display fields. */
interface AnimalRow extends AnimalWithSpecies {
  displayName: string;
  speciesName: string;
  birthDateDisplay: string;
  vaccinationDateDisplay: string;
  ageDisplay: string | null;
  statusDisplay: string;
}

@Component({
  selector: 'app-animals-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TranslatePipe,
    UiDataTable,
    AddAnimalDialogComponent,
    SpeciesSectionComponent,
  ],
  host: {
    class: 'block space-y-4 sm:space-y-6 px-2 sm:px-0',
  },
  template: `
    <section class="card-glass p-4 sm:p-6 rounded-xl sm:rounded-2xl">
      <header class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="min-w-0">
          <h1 class="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-50 truncate">
            {{ 'translate_animals-title' | translate }}
          </h1>
          <p class="mt-1 text-xs sm:text-sm text-muted line-clamp-2 sm:line-clamp-none">
            {{ 'translate_animals-subtitle' | translate }}
          </p>
        </div>
        <div class="flex flex-shrink-0 gap-2">
          <button
            type="button"
            class="btn-primary flex-1 sm:flex-none px-3 py-2 sm:px-4 sm:py-1.5 text-xs"
            (click)="openAddDialog()"
          >
            {{ 'translate_animals-add-animal' | translate }}
          </button>
          <button
            type="button"
            class="btn-ghost flex-1 sm:flex-none px-3 py-2 sm:px-4 sm:py-1.5 text-xs"
            (click)="reload()"
          >
            {{ 'translate_animals-refresh' | translate }}
          </button>
        </div>
      </header>

      @if (error()) {
        <p class="text-xs text-red-400">
          {{ error() }}
        </p>
      }

      @if (speciesList().length === 0) {
        <p class="text-xs text-muted">
          {{ 'translate_animals-species-empty' | translate }}
        </p>
      }

      @if (loading()) {
        <p class="mt-2 text-xs text-muted">...</p>
      } @else if (tableRows().length === 0) {
        <p class="mt-2 text-xs text-muted">
          {{ 'translate_animals-empty' | translate }}
        </p>
      } @else {
        <app-ui-data-table
          class="mt-2"
          [rows]="tableRows()"
          [loading]="loading()"
          [columns]="columns"
          [filters]="filters()"
          emptyKey="translate_animals-empty"
          (rowAction)="onRowAction($event)"
        />
      }
    </section>

    <app-species-section
      [species]="speciesList()"
      [loading]="speciesLoading()"
    />

    <app-add-animal-dialog
      [open]="addDialogOpen()"
      [speciesList]="speciesList()"
      [animal]="editingAnimal()"
      (saved)="onAnimalSaved()"
      (closed)="closeAddDialog()"
    />
  `,
})
export class AnimalsPage {
  private readonly animalsService = inject(AnimalsService);
  private readonly speciesService = inject(SpeciesService);
  private readonly translation = inject(TranslationService);
  private readonly router = inject(Router);

  protected readonly animals = signal<AnimalWithSpecies[]>([]);
  protected readonly speciesList = signal<Species[]>([]);
  protected readonly loading = signal(true);
  protected readonly speciesLoading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly addDialogOpen = signal(false);
  protected readonly editingAnimal = signal<AnimalWithSpecies | null>(null);

  protected readonly tableRows = computed<AnimalRow[]>(() => {
    return this.animals().map((a) => this.toRow(a));
  });

  protected readonly columns: ColumnConfig<AnimalRow>[] = [
    {
      headerKey: 'translate_name',
      field: 'displayName',
      widthClass: 'w-40',
    },
    {
      headerKey: 'translate_animals-identifier',
      field: 'identifier',
      widthClass: 'w-28',
    },
    {
      headerKey: 'translate_animals-filter-species-label',
      field: 'speciesName',
      widthClass: 'w-32',
    },
    {
      headerKey: 'translate_status',
      field: 'statusDisplay',
      widthClass: 'w-28',
    },
    {
      headerKey: 'translate_animals-birth-date',
      field: 'birthDateDisplay',
      widthClass: 'w-28',
    },
    {
      headerKey: 'translate_animals-vaccination-date',
      field: 'vaccinationDateDisplay',
      widthClass: 'w-28',
    },
    {
      headerKey: 'translate_animals-age',
      field: 'ageDisplay',
      widthClass: 'w-24',
    },
    {
      headerKey: 'translate_actions',
      align: 'right',
      actions: [
        { id: 'view', labelKey: 'translate_animals-view-details', variant: 'ghost' },
        { id: 'edit', labelKey: 'translate_animals-edit', variant: 'primary' },
      ],
    },
  ];

  protected readonly filters = computed<FilterConfig<AnimalRow>[]>(() => {
    const lang = this.translation.currentLang();
    return [
    {
      id: 'search',
      labelKey: 'translate_animals-filter-search-label',
      placeholderKey: 'translate_animals-filter-search-placeholder',
      type: 'text',
      fields: ['displayName', 'identifier', 'speciesName'],
    },
    {
      id: 'species',
      labelKey: 'translate_animals-filter-species-label',
      placeholderKey: 'translate_animals-filter-species-placeholder',
      type: 'select',
      fields: ['speciesId'],
      options: this.speciesList().map((s) => ({
        labelKey: lang === 'ar' ? s.nameAr : s.nameEn,
        value: s.id,
      })),
    },
    {
      id: 'status',
      labelKey: 'translate_animals-filter-status-label',
      placeholderKey: 'translate_animals-filter-status-placeholder',
      type: 'select',
      fields: ['status'],
      options: [
        { labelKey: 'translate_animals-status-newborn', value: 'newborn' },
        { labelKey: 'translate_animals-status-gives-egg', value: 'gives_egg' },
        { labelKey: 'translate_animals-status-alive', value: 'alive' },
        { labelKey: 'translate_animals-status-died', value: 'died' },
        { labelKey: 'translate_animals-status-sick', value: 'sick' },
      ],
    },
  ];
  });

  constructor() {
    void this.reload();
    void this.loadSpecies();
  }

  private toRow(a: AnimalWithSpecies): AnimalRow {
    const lang = this.translation.currentLang();
    const displayName =
      a.name?.trim() || a.identifier?.trim() || a.id || '—';
    const speciesName = lang === 'ar' ? a.speciesNameAr : a.speciesNameEn;
    const birthDateDisplay = a.birthDate
      ? a.birthDate.toLocaleDateString()
      : '';
    const vaccinationDateDisplay = a.vaccinationDate
      ? a.vaccinationDate.toLocaleDateString()
      : '';
    const ageDisplay = getAgeFromBirthDate(a.birthDate);
    const statusDisplay = this.translation.instant(STATUS_KEYS[a.status] ?? a.status);
    return {
      ...a,
      displayName,
      speciesName,
      birthDateDisplay,
      vaccinationDateDisplay,
      ageDisplay,
      statusDisplay,
    };
  }

  protected openAddDialog(): void {
    this.editingAnimal.set(null);
    this.addDialogOpen.set(true);
  }

  protected closeAddDialog(): void {
    this.addDialogOpen.set(false);
    this.editingAnimal.set(null);
    this.error.set(null);
  }

  protected onRowAction(event: TableRowActionEvent<AnimalRow>): void {
    if (event.actionId === 'view') {
      void this.router.navigate(['/animals', event.row.id]);
      return;
    }
    if (event.actionId === 'edit') {
      this.editingAnimal.set(event.row);
      this.addDialogOpen.set(true);
    }
  }

  protected onAnimalSaved(): void {
    void this.reload();
    this.closeAddDialog();
  }

  async loadSpecies(): Promise<void> {
    this.speciesLoading.set(true);
    try {
      const list = await this.speciesService.loadAll();
      this.speciesList.set(list);
    } catch {
      this.speciesList.set([]);
    } finally {
      this.speciesLoading.set(false);
    }
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const list = await this.animalsService.loadAll();
      this.animals.set(list);
    } catch (err) {
      this.error.set(typeof err === 'string' ? err : this.translation.instant('translate_animals-error-load'));
    } finally {
      this.loading.set(false);
    }
  }
}
