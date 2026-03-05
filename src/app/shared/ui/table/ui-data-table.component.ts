import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { TranslatePipe } from '@ngx-translate/core';

import { UiButton } from '../button/ui-button.component';

export type ColumnAlign = 'left' | 'center' | 'right';

export interface TableAction<T> {
  id: string;
  labelKey: string;
  variant?: 'primary' | 'ghost' | 'danger' | 'outline';
  disabled?: (row: T) => boolean;
}

export interface ColumnConfig<T> {
  headerKey: string;
  field?: keyof T;
  widthClass?: string;
  align?: ColumnAlign;
  actions?: TableAction<T>[];
}

type FilterType = 'text' | 'select' | 'multi-select';

export interface FilterOption {
  labelKey: string;
  value: string;
}

export interface FilterConfig<T> {
  id: string;
  labelKey: string;
  placeholderKey?: string;
  type: FilterType;
  /**
   * For `text` filters: which fields to search.
   * For `select` / `multi-select`: which field to compare against the selected value(s).
   */
  fields: (keyof T)[];
  options?: FilterOption[];
}

export interface TableRowActionEvent<T> {
  actionId: string;
  row: T;
}

@Component({
  selector: 'app-ui-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TableModule, InputTextModule, TranslatePipe, UiButton],
  host: {
    class: 'block w-full',
  },
  template: `
    <!-- Filters -->
    @if (filters().length) {
      <div class="mb-3 flex flex-wrap items-end gap-3">
        @for (filter of filters(); track filter.id) {
          <div class="flex flex-col gap-1 text-[11px]">
            <label class="text-muted">
              {{ filter.labelKey | translate }}
            </label>

            @if (filter.type === 'text') {
              <input
                pInputText
                class="input-glass h-8 text-xs"
                [placeholder]="
                  filter.placeholderKey
                    ? (filter.placeholderKey | translate)
                    : null
                "
                [ngModel]="filterState()[filter.id] ?? ''"
                (ngModelChange)="onFilterChange(filter.id, $event)"
              />
            } @else {
              <select
                class="input-glass h-8 text-xs"
                [attr.multiple]="filter.type === 'multi-select' ? '' : null"
                [ngModel]="
                  filter.type === 'multi-select'
                    ? (filterState()[filter.id] ?? [])
                    : (filterState()[filter.id] ?? '')
                "
                (ngModelChange)="onFilterChange(filter.id, $event)"
              >
                @if (filter.type === 'select' && filter.placeholderKey) {
                  <option value="">
                    {{ filter.placeholderKey | translate }}
                  </option>
                }
                @for (option of filter.options ?? []; track option.value) {
                  <option [value]="option.value">
                    {{ option.labelKey | translate }}
                  </option>
                }
              </select>
            }
          </div>
        }

        <div class="ms-auto">
          @if (hasActiveFilters()) {
            <app-ui-button
              variant="ghost"
              size="sm"
              labelKey="translate_table-filter-clear"
              (click)="clearFilters()"
            />
          }
        </div>
      </div>
    }

    <!-- Table -->
    <p-table
      [value]="filteredRows()"
      [loading]="loading()"
      [tableStyle]="{ 'min-width': '20rem' }"
      styleClass="p-datatable-sm"
    >
      <ng-template pTemplate="header">
        <tr>
          @for (column of columns(); track column.headerKey) {
            <th
              class="py-2 px-3 text-left text-[11px] uppercase tracking-wide text-muted"
              [class.text-center]="column.align === 'center'"
              [class.text-right]="column.align === 'right'"
              [class.w-32]="column.widthClass === 'w-32'"
              [class.w-40]="column.widthClass === 'w-40'"
            >
              {{ column.headerKey | translate }}
            </th>
          }
        </tr>
      </ng-template>

      <ng-template pTemplate="body" let-row>
        <tr class="border-b border-white/5 last:border-0">
          @for (column of columns(); track column.headerKey) {
            <td
              class="py-2 px-3 text-xs text-slate-900 dark:text-slate-50"
              [class.text-center]="column.align === 'center'"
              [class.text-right]="column.align === 'right'"
            >
              @if (column.actions?.length) {
                <div class="inline-flex flex-wrap gap-1">
                  @for (action of column.actions; track action.id) {
                    <app-ui-button
                      size="sm"
                      [variant]="action.variant ?? 'ghost'"
                      [labelKey]="action.labelKey"
                      [disabled]="action.disabled ? action.disabled(row) : false"
                      (click)="onRowAction(action.id, row)"
                    />
                  }
                </div>
              } @else {
                {{ getCellValue(row, column) }}
              }
            </td>
          }
        </tr>
      </ng-template>

      <ng-template pTemplate="emptymessage">
        <tr>
          <td
            [attr.colspan]="columns().length || 1"
            class="py-4 text-center text-xs text-muted"
          >
            {{ emptyKey() | translate }}
          </td>
        </tr>
      </ng-template>
    </p-table>
  `,
})
export class UiDataTable<T extends object = Record<string, unknown>> {
  readonly rows = input<readonly T[]>([]);
  readonly columns = input<readonly ColumnConfig<T>[]>([]);
  readonly filters = input<readonly FilterConfig<T>[]>([]);
  readonly loading = input(false);
  readonly emptyKey = input('translate_no-data');

  readonly rowAction = output<TableRowActionEvent<T>>();

  protected readonly filterState = signal<Record<string, unknown>>({});

  protected readonly filteredRows = computed<T[]>(() =>
    this.applyFilters(this.rows() ?? [], this.filters() ?? [], this.filterState()),
  );

  protected hasActiveFilters(): boolean {
    const current = this.filterState();
    return Object.values(current).some((value) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== undefined && value !== null && value !== '';
    });
  }

  protected onFilterChange(id: string, value: unknown): void {
    this.filterState.update((current) => ({
      ...current,
      [id]: value,
    }));
  }

  protected clearFilters(): void {
    this.filterState.set({});
  }

  protected onRowAction(actionId: string, row: T): void {
    this.rowAction.emit({ actionId, row });
  }

  protected getCellValue(row: T, column: ColumnConfig<T>): unknown {
    if (!column.field) {
      return '';
    }

    return (row as any)[column.field as string];
  }

  private applyFilters(
    rows: readonly T[],
    filters: readonly FilterConfig<T>[],
    state: Record<string, unknown>,
  ): T[] {
    if (!filters.length) {
      return [...rows];
    }

    return rows.filter((row) => {
      for (const filter of filters) {
        const rawValue = state[filter.id];

        if (filter.type === 'text') {
          if (!rawValue) {
            continue;
          }
          const search = String(rawValue).toLowerCase().trim();
          if (!search) {
            continue;
          }

          const match = filter.fields.some((field) => {
            const fieldValue = (row as any)[field as string];
            return (
              fieldValue !== undefined &&
              fieldValue !== null &&
              String(fieldValue).toLowerCase().includes(search)
            );
          });

          if (!match) {
            return false;
          }
        } else {
          const field = filter.fields[0];
          if (!field) {
            continue;
          }

          if (filter.type === 'select') {
            if (!rawValue) {
              continue;
            }
            const rowValue = (row as any)[field as string];
            if (rowValue !== rawValue) {
              return false;
            }
          } else {
            const selected = Array.isArray(rawValue) ? rawValue : [];
            if (!selected.length) {
              continue;
            }
            const rowValue = (row as any)[field as string];
            if (!selected.includes(rowValue)) {
              return false;
            }
          }
        }
      }

      return true;
    });
  }
}

