import { Pipe, PipeTransform } from '@angular/core';

import type { TableAction } from '../ui-data-table.component';

@Pipe({ name: 'tableActionIcon', standalone: true, pure: true })
export class TableActionIconPipe implements PipeTransform {
  transform<T>(action: TableAction<T>): string | null {
    if (!action.icon) return null;
    if (
      action.icon === 'view' ||
      action.icon === 'edit' ||
      action.icon === 'delete' ||
      action.icon === 'comment'
    ) {
      return `table-action-icon table-action-icon-${action.icon}`;
    }
    return action.icon;
  }
}
