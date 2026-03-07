import { Pipe, PipeTransform } from '@angular/core';

import type { ColumnConfig } from '../ui-data-table.component';

@Pipe({ name: 'tableCellValue', standalone: true, pure: true })
export class TableCellValuePipe implements PipeTransform {
  transform<T>(row: T, column: ColumnConfig<T>): unknown {
    if (!column.field) return '';
    return (row as Record<string, unknown>)[column.field as string];
  }
}
