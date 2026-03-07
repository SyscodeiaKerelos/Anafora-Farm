import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'tableRowId', standalone: true, pure: true })
export class TableRowIdPipe implements PipeTransform {
  transform(row: Record<string, unknown>, rowIdKey: string): string {
    const v = row[rowIdKey];
    return v !== undefined && v !== null ? String(v) : '';
  }
}
