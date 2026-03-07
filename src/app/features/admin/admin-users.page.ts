import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthService } from '../../core/services/auth.service';
import { Role } from '../../core/types/role';
import { TranslationService } from '../../core/services/translation.service';
import { AdminUser } from '../../core/types/admin-user';
import { UserDirectoryService } from '../../core/services/user-directory.service';
import {
  UiDataTable,
  type ColumnConfig,
  type FilterConfig,
  type TableRowActionEvent,
} from '../../shared/ui/table/ui-data-table.component';
import { AddUserDialogComponent } from './add-user-dialog.component';

@Component({
  selector: 'app-admin-users-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe, UiDataTable, AddUserDialogComponent],
  host: {
    class: 'block space-y-6',
  },
  template: `
    @if (canManage()) {
      <section class="card-glass p-6 text-center">
        <h1 class="text-xl font-semibold text-slate-900 dark:text-slate-50">
          {{ 'translate_admin-restricted-title' | translate }}
        </h1>
        <p class="mt-2 text-muted">
          {{ 'translate_admin-restricted-body' | translate }}
        </p>
      </section>
    } @else {
      <section class="card-glass p-6">
        <header class="mb-4 flex items-center justify-between">
          <div>
            <h1 class="text-xl font-semibold text-slate-900 dark:text-slate-50">
              {{ 'translate_admin-users-title' | translate }}
            </h1>
            <p class="mt-1 text-muted">
              {{ 'translate_admin-users-subtitle' | translate }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="btn-primary"
              (click)="openAddUserDialog()"
            >
              {{ 'translate_admin-users-add-user' | translate }}
            </button>
            <button
              type="button"
              class="btn-ghost"
              (click)="reload()"
            >
              {{ 'translate_admin-users-refresh' | translate }}
            </button>
          </div>
        </header>

        <app-ui-data-table
          class="mt-2"
          [rows]="users()"
          [loading]="loading()"
          [columns]="columns"
          [filters]="filters"
          emptyKey="translate_admin-users-empty"
          (rowAction)="onRowAction($event)"
        />

        <p class="mt-3 text-xs text-muted">
          {{ 'translate_admin-users-footer-note' | translate }}
        </p>
      </section>
    }

    <app-add-user-dialog
      [open]="addUserDialogOpen() === true"
      (created)="onUserCreated($event)"
      (closed)="closeAddUserDialog()"
    />
  `,
})
export class AdminUsersPage {
  private readonly authService = inject(AuthService);
  private readonly translation = inject(TranslationService);
  private readonly userDirectory = inject(UserDirectoryService);

  protected readonly users = signal<AdminUser[]>([]);
  protected readonly loading = signal(true);
  protected readonly savingId = signal<string | null>(null);

  protected readonly canManage = computed(() => this.authService.hasAtLeastRole('superAdmin'));
  protected readonly addUserDialogOpen = signal(false);

  protected readonly columns: ColumnConfig<AdminUser>[] = [
    {
      headerKey: 'translate_email',
      field: 'email',
      widthClass: 'w-40',
    },
    {
      headerKey: 'translate_name',
      field: 'displayName',
      widthClass: 'w-40',
    },
    {
      headerKey: 'translate_role',
      field: 'role',
      widthClass: 'w-32',
    },
    {
      headerKey: 'translate_actions',
      align: 'right',
      actions: [
        {
          id: 'user',
          labelKey: 'translate_role-user-label',
          variant: 'ghost',
        },
        {
          id: 'admin',
          labelKey: 'translate_role-admin-label',
          variant: 'ghost',
        },
        {
          id: 'superAdmin',
          labelKey: 'translate_role-super-admin-label',
          variant: 'primary',
        },
      ],
    },
  ];

  protected readonly filters: FilterConfig<AdminUser>[] = [
    {
      id: 'search',
      labelKey: 'translate_admin-users-filter-search-label',
      placeholderKey: 'translate_admin-users-filter-search-placeholder',
      type: 'text',
      fields: ['email', 'displayName'],
    },
    {
      id: 'role',
      labelKey: 'translate_admin-users-filter-role-label',
      placeholderKey: 'translate_admin-users-filter-role-placeholder',
      type: 'multi-select',
      fields: ['role'],
      options: [
        { labelKey: 'translate_role-user-label', value: 'user' },
        { labelKey: 'translate_role-admin-label', value: 'admin' },
        { labelKey: 'translate_role-super-admin-label', value: 'superAdmin' },
      ],
    },
  ];

  constructor() {
    void this.reload();
  }

  protected openAddUserDialog(): void {
    this.addUserDialogOpen.set(true);
  }

  protected closeAddUserDialog(): void {
    this.addUserDialogOpen.set(false);
  }

  protected onUserCreated(user: AdminUser): void {
    this.users.update((current) => [...current, user]);
    this.closeAddUserDialog();
  }

  onRowAction(event: TableRowActionEvent<AdminUser>): void {
    if (!this.canManage()) {
      return;
    }

    const role = event.actionId as Role;
    if (role === 'user' || role === 'admin' || role === 'superAdmin') {
      void this.updateRole(event.row.id, role);
    }
  }

  async reload(): Promise<void> {
    if (!this.canManage()) {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    try {
      const users = await this.userDirectory.loadAll();
      this.users.set(users);
    } catch {
      this.users.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async updateRole(id: string, role: Role): Promise<void> {
    if (!this.canManage()) {
      return;
    }

    this.savingId.set(id);
    try {
      await this.userDirectory.updateRole(id, role);
      this.users.update((current) =>
        current.map((user) => (user.id === id ? { ...user, role } : user)),
      );
    } catch {
      // Error shown via NotificationService in UserDirectoryService
    } finally {
      this.savingId.set(null);
    }
  }
}

