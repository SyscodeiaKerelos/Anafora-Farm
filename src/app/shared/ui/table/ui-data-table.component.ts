import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
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
import { TableCellValuePipe } from './pipes/table-cell-value.pipe';
import { TableRowIdPipe } from './pipes/table-row-id.pipe';
import { TableActionIconPipe } from './pipes/table-action-icon.pipe';

export type ColumnAlign = 'left' | 'center' | 'right';

/** Built-in icon names rendered as inline SVG; any other string is used as CSS class for <i>. */
export type TableActionIcon = 'view' | 'edit' | 'delete' | 'comment';

export interface TableAction<T> {
  id: string;
  labelKey?: string;
  variant?: 'primary' | 'ghost' | 'danger' | 'outline';
  /** Icon: use 'view' | 'edit' | 'delete' for built-in SVG, or a CSS class string (e.g. 'pi pi-eye'). */
  icon?: TableActionIcon | string;
  disabled?: (row: T) => boolean;
}

export interface ColumnConfig<T> {
  headerKey: string;
  field?: keyof T;
  widthClass?: string;
  align?: ColumnAlign;
  /** When true, use this column's value as the card title on mobile. Default: first column with a field. */
  primaryOnMobile?: boolean;
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
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    TranslatePipe,
    UiButton,
    TableCellValuePipe,
    TableRowIdPipe,
    TableActionIconPipe,
  ],
  host: {
    class: 'block w-full',
  },
  template: `
    <!-- Filters: responsive stacking on small screens -->
    @if (filters().length) {
      <div class="mb-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3">
        @for (filter of filters(); track filter.id) {
          <div class="flex min-w-0 flex-1 flex-col gap-1 text-[11px] sm:min-w-0 sm:flex-initial">
            <label class="text-muted">
              {{ filter.labelKey | translate }}
            </label>
            @if (filter.type === 'text') {
              <input
                pInputText
                class="input-glass min-h-10 w-full py-2 text-sm"
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
                class="input-glass min-h-10 w-full min-w-0 py-2 text-sm sm:min-w-[8rem]"
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
        <div class="flex shrink-0 sm:ms-auto">
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

    <!-- Mobile: card list (visible only below md) -->
    <div class="block md:hidden space-y-3">
      @if (loading()) {
        <div class="rounded-xl border border-slate-200/50 bg-white/40 px-4 py-6 text-center text-xs text-muted dark:border-white/10 dark:bg-slate-900/40">
          ...
        </div>
      } @else if (filteredRows().length === 0) {
        <div class="rounded-xl border border-slate-200/50 bg-white/40 px-4 py-6 text-center text-xs text-muted dark:border-white/10 dark:bg-slate-900/40">
          {{ emptyKey() | translate }}
        </div>
      } @else {
        @for (row of filteredRows(); track $index) {
          <article
            class="rounded-xl border border-slate-200/70 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/60"
          >
            <h3 class="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">
              @if (primaryColumn(); as primary) {
                {{ row | tableCellValue : primary }}
              }
            </h3>
            <dl class="mt-3 space-y-1.5">
              @for (col of dataColumns(); track col.headerKey) {
                <div class="flex flex-wrap items-baseline gap-x-2 text-xs">
                  <dt class="shrink-0 text-muted">{{ col.headerKey | translate }}</dt>
                  <dd class="min-w-0 text-slate-900 dark:text-slate-50">{{ row | tableCellValue : col }}</dd>
                </div>
              }
            </dl>
            @if (actionColumns().length) {
              <div class="mt-3 flex flex-wrap gap-2 border-t border-slate-200/50 pt-3 dark:border-white/10">
                @for (col of actionColumns(); track col.headerKey) {
                  @for (action of col.actions ?? []; track action.id) {
                    <app-ui-button
                      size="xs"
                      class="min-w-[4.5rem]"
                      [variant]="action.variant ?? 'ghost'"
                      [labelKey]="action?.labelKey ?? null"
                      [icon]="action | tableActionIcon"
                      [disabled]="action.disabled ? action.disabled(row) : false"
                      (click)="onRowAction(action.id, row)"
                    />
                  }
                }
              </div>
            }
          </article>
        }
      }
    </div>

    <!-- Desktop: table (visible from md up) -->
    <div class="hidden md:block overflow-x-auto -mx-1 sm:mx-0 rounded-lg border border-slate-200/50 dark:border-white/10">
      <p-table
        [value]="filteredRows()"
        [loading]="loading()"
        [tableStyle]="{ 'min-width': '20rem' }"
        styleClass="p-datatable-sm w-full"
      >
        <ng-template pTemplate="header">
          <tr>
            @for (column of columns(); track column.headerKey) {
              <th
                class="py-2 px-3 text-center text-[11px] uppercase tracking-wide text-muted"
                [class.text-left]="column.align === 'left'"
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
                class="py-2 px-3 text-xs text-center text-slate-900 dark:text-slate-50"
                [class.text-left]="column.align === 'left'"
                [class.text-right]="column.align === 'right'"
              >
                @if (column.actions?.length) {
                  <div class="relative inline-block">
                    <button
                      type="button"
                      class="btn-ghost inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] min-w-[4.5rem]"
                      (click)="toggleActionMenu(row)"
                      [attr.aria-expanded]="openMenuRowId() === (row | tableRowId : rowIdKey())"
                      [attr.aria-haspopup]="'true'"
                    >
                      <span>{{ 'translate_table-actions-menu' | translate }}</span>
                      <span class="text-[8px] opacity-70" aria-hidden="true">&#9660;</span>
                    </button>
                    @if (openMenuRowId() === (row | tableRowId : rowIdKey())) {
                      <div
                        class="menu-surface menu-surface-enter absolute right-0 z-20 mt-1 w-44 rounded-xl border border-slate-200/70 bg-white/90 py-1 text-xs shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-50"
                        role="menu"
                      >
                        @for (action of column.actions; track action.id) {
                          <button
                            type="button"
                            role="menuitem"
                            class="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-white/10 disabled:opacity-50"
                            [disabled]="action.disabled ? action.disabled(row) : false"
                            (click)="onMenuAction(action.id, row)"
                          >
                            @if (action | tableActionIcon; as iconClass) {
                              <i [class]="iconClass" aria-hidden="true"></i>
                            }
                            <span>{{ (action.labelKey ?? '') | translate }}</span>
                          </button>
                        }
                      </div>
                    }
                  </div>
                } @else {
                  {{ row | tableCellValue : column }}
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
    </div>
  `,
})
export class UiDataTable<T extends object = Record<string, unknown>> {
  readonly rows = input<readonly T[]>([]);
  readonly columns = input<readonly ColumnConfig<T>[]>([]);
  readonly filters = input<readonly FilterConfig<T>[]>([]);
  readonly loading = input(false);
  readonly emptyKey = input('translate_no-data');
  /** Field name on the row object used as unique id for the actions menu. Default: 'id'. */
  readonly rowIdKey = input<string>('id');

  readonly rowAction = output<TableRowActionEvent<T>>();

  protected readonly filterState = signal<Record<string, unknown>>({});
  protected readonly openMenuRowId = signal<string | null>(null);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  constructor() {
    effect(() => {
      const openId = this.openMenuRowId();
      if (openId === null) return;
      const handler = (e: MouseEvent) => {
        const el = this.elementRef.nativeElement;
        if (el.contains(e.target as Node)) return;
        this.openMenuRowId.set(null);
      };
      const t = setTimeout(() => document.addEventListener('click', handler, true), 0);
      return () => {
        clearTimeout(t);
        document.removeEventListener('click', handler, true);
      };
    });
  }

  protected getRowId(row: T): string {
    const key = this.rowIdKey();
    const v = (row as Record<string, unknown>)[key];
    return v !== undefined && v !== null ? String(v) : '';
  }

  protected isActionMenuOpen(row: T): boolean {
    return this.openMenuRowId() === this.getRowId(row);
  }

  protected toggleActionMenu(row: T): void {
    const id = this.getRowId(row);
    this.openMenuRowId.update((current) => (current === id ? null : id));
  }

  protected onMenuAction(actionId: string, row: T): void {
    this.openMenuRowId.set(null);
    this.onRowAction(actionId, row);
  }

  protected readonly filteredRows = computed<T[]>(() =>
    this.applyFilters(this.rows() ?? [], this.filters() ?? [], this.filterState()),
  );

  protected readonly hasActiveFilters = computed(() => {
    const current = this.filterState();
    return Object.values(current).some((value) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && value !== '';
    });
  });

  protected readonly primaryColumn = computed(() => {
    const cols = this.columns() ?? [];
    const primary = cols.find((c) => c.primaryOnMobile && c.field);
    return primary ?? cols.find((c) => c.field) ?? null;
  });

  protected readonly dataColumns = computed(() => {
    const cols = this.columns() ?? [];
    const primary = this.primaryColumn();
    return cols.filter(
      (c) => c.field && !(c.actions?.length && !c.field) && c !== primary,
    );
  });

  protected readonly actionColumns = computed(() => {
    const cols = this.columns() ?? [];
    return cols.filter((c) => (c.actions?.length ?? 0) > 0);
  });

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

