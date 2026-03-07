import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ContextMenuModule, ContextMenu } from 'primeng/contextmenu';
import { MenuItem } from 'primeng/api';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';

import { UiButton } from '../button/ui-button.component';
import { TableCellValuePipe } from './pipes/table-cell-value.pipe';
import { TableActionIconPipe } from './pipes/table-action-icon.pipe';
import { TranslationService } from '../../../core/services/translation.service';

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

/** Map table action icon to PrimeIcons class (pi pi-fw pi-*). */
function actionIconToPrimeIcon(icon: TableActionIcon | string | undefined): string {
  if (!icon) return 'pi pi-fw pi-bars';
  switch (icon) {
    case 'view':
      return 'pi pi-fw pi-search';
    case 'edit':
      return 'pi pi-fw pi-pencil';
    case 'delete':
      return 'pi pi-fw pi-trash';
    case 'comment':
      return 'pi pi-fw pi-comment';
    default:
      return typeof icon === 'string' ? icon : 'pi pi-fw pi-bars';
  }
}

@Component({
  selector: 'app-ui-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    ContextMenuModule,
    TranslatePipe,
    NgIcon,
    UiButton,
    TableCellValuePipe
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

    <!-- Table: same table layout on all screen sizes; horizontal scroll on small screens -->
    <!-- Row actions: PrimeNG Context Menu (shown on 3-dots button click). appendTo="body" so the overlay is not clipped by the table's overflow and positions correctly. -->
    <p-contextmenu
      #rowContextMenu
      [model]="contextMenuItems()"
      appendTo="body"
      (onHide)="contextMenuRow.set(null)"

    />

    <div class="overflow-x-auto -mx-1 sm:mx-0 rounded-lg border border-slate-200/50 dark:border-white/10">
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
                  <button
                    type="button"
                    class="inline-flex items-center justify-center rounded-full p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    [attr.aria-label]="'translate_table-actions-menu' | translate"
                    (click)="openRowContextMenu(row, column.actions ?? [], $event)"
                  >
                    <ng-icon name="faSolidEllipsisVertical" size="1rem" />
                  </button>
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
  protected readonly contextMenuRow = signal<T | null>(null);
  protected readonly contextMenuItems = signal<MenuItem[]>([]);
  private readonly rowContextMenuRef = viewChild<ContextMenu>('rowContextMenu');
  private readonly translation = inject(TranslationService);

  protected getRowId(row: T): string {
    const key = this.rowIdKey();
    const v = (row as Record<string, unknown>)[key];
    return v !== undefined && v !== null ? String(v) : '';
  }

  protected openRowContextMenu(row: T, actions: TableAction<T>[], event: MouseEvent): void {
    this.contextMenuRow.set(row);
    this.contextMenuItems.set(this.buildContextMenuItems(row, actions));
    this.rowContextMenuRef()?.show(event);
  }

  private buildContextMenuItems(row: T, actions: TableAction<T>[]): MenuItem[] {
    return actions.map((action) => ({
      label: this.translation.instant(action.labelKey ?? ''),
      icon: actionIconToPrimeIcon(action.icon),
      disabled: action.disabled?.(row) ?? false,
      command: () => {
        const r = this.contextMenuRow();
        if (r) this.onRowAction(action.id, r);
      },
    }));
  }

  protected onMenuAction(actionId: string, row: T): void {
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

