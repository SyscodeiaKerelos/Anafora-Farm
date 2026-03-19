import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthService } from '../../core/services/auth.service';
import { Role } from '../../core/types/role';
import { TranslationService } from '../../core/services/translation.service';
import { AdminUser } from '../../core/types/admin-user';
import { UserDirectoryService } from '../../core/services/user-directory.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  UiDataTable,
  type ColumnConfig,
  type FilterConfig,
  type TableRowActionEvent,
} from '../../shared/ui/table/ui-data-table.component';
import { AddUserDialogComponent } from './add-user-dialog.component';
import { UiConfirmDialog } from '../../shared/ui/dialog/ui-confirm-dialog.component';
import { UiButton } from '../../shared/ui/button/ui-button.component';

@Component({
  selector: 'app-admin-users-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TranslatePipe,
    UiDataTable,
    AddUserDialogComponent,
    UiConfirmDialog,
    UiButton,
  ],
  host: {
    class: 'block space-y-6',
  },
  template: `
    @if (!canManage()) {
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
            <app-ui-button
              variant="primary"
              size="sm"
              labelKey="translate_admin-users-add-user"
              (clicked)="openAddUserDialog()"
            />
            <app-ui-button
              variant="ghost"
              size="sm"
              labelKey="translate_admin-users-refresh"
              (clicked)="reload()"
            />
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

        <div class="mt-4 flex items-center justify-between">
          <p class="text-xs text-muted">
            {{ 'translate_admin-users-footer-note' | translate }}
          </p>
          @if (stats()) {
            <div class="flex items-center gap-4 text-xs text-muted">
              <span class="flex items-center gap-1">
                <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
                {{ stats().active }} {{ 'translate_admin-users-active' | translate }}
              </span>
              <span class="flex items-center gap-1">
                <span class="h-2 w-2 rounded-full bg-red-500"></span>
                {{ stats().inactive }} {{ 'translate_admin-users-inactive' | translate }}
              </span>
            </div>
          }
        </div>
      </section>
    }

    <app-add-user-dialog
      [open]="addUserDialogOpen() === true"
      (created)="onUserCreated($event)"
      (closed)="closeAddUserDialog()"
    />

    <app-ui-confirm-dialog
      [open]="confirmDialog().open"
      [titleKey]="confirmDialog().titleKey"
      [messageKey]="confirmDialog().messageKey"
      [confirmLabelKey]="confirmDialog().confirmLabelKey"
      (confirmed)="onConfirmAction()"
      (cancelled)="closeConfirmDialog()"
    />
  `,
})
export class AdminUsersPage {
  private readonly authService = inject(AuthService);
  private readonly translation = inject(TranslationService);
  private readonly userDirectory = inject(UserDirectoryService);
  private readonly notification = inject(NotificationService);

  protected readonly users = signal<AdminUser[]>([]);
  protected readonly loading = signal(true);
  protected readonly savingId = signal<string | null>(null);

  protected readonly canManage = computed(() => this.authService.hasAtLeastRole('superAdmin'));
  protected readonly addUserDialogOpen = signal(false);

  protected readonly confirmDialog = signal<{
    open: boolean;
    titleKey: string;
    messageKey: string;
    confirmLabelKey: string;
    action: 'deactivate' | 'delete' | null;
    userId: string | null;
  }>({
    open: false,
    titleKey: '',
    messageKey: '',
    confirmLabelKey: '',
    action: null,
    userId: null,
  });

  protected readonly confirmLoading = signal(false);

  protected readonly stats = computed(() => {
    const all = this.users();
    return {
      active: all.filter((u) => u.isActive !== false).length,
      inactive: all.filter((u) => u.isActive === false).length,
    };
  });

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
      headerKey: 'translate_status',
      field: 'isActive',
      widthClass: 'w-24',
    },
    {
      headerKey: 'translate_actions',
      align: 'right',
      widthClass: 'w-40',
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
    {
      headerKey: '',
      align: 'right',
      widthClass: 'w-20',
      actions: [
        {
          id: 'deactivate',
          labelKey: 'translate_deactivate',
          variant: 'ghost',
          icon: 'faSolidBan',
        },
        {
          id: 'delete',
          labelKey: 'translate_delete',
          variant: 'danger',
          icon: 'faSolidTrash',
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

    const { actionId, row } = event;

    if (actionId === 'deactivate') {
      this.openDeactivateDialog(row);
      return;
    }

    if (actionId === 'delete') {
      this.openDeleteDialog(row);
      return;
    }

    const role = actionId as Role;
    if (role === 'user' || role === 'admin' || role === 'superAdmin') {
      void this.updateRole(event.row.id, role);
    }
  }

  openDeactivateDialog(user: AdminUser): void {
    this.confirmDialog.set({
      open: true,
      titleKey: 'translate_deactivate-user-title',
      messageKey: 'translate_deactivate-user-message',
      confirmLabelKey: 'translate_deactivate',
      action: 'deactivate',
      userId: user.id,
    });
  }

  openDeleteDialog(user: AdminUser): void {
    this.confirmDialog.set({
      open: true,
      titleKey: 'translate_delete-user-title',
      messageKey: 'translate_delete-user-message',
      confirmLabelKey: 'translate_delete',
      action: 'delete',
      userId: user.id,
    });
  }

  closeConfirmDialog(): void {
    this.confirmDialog.set({
      open: false,
      titleKey: '',
      messageKey: '',
      confirmLabelKey: '',
      action: null,
      userId: null,
    });
  }

  async onConfirmAction(): Promise<void> {
    const dialog = this.confirmDialog();
    if (!dialog.action || !dialog.userId) return;

    this.confirmLoading.set(true);

    try {
      if (dialog.action === 'deactivate') {
        await this.userDirectory.deactivateUser(dialog.userId);
        this.users.update((current) =>
          current.map((u) => (u.id === dialog.userId ? { ...u, isActive: false } : u)),
        );
        this.notification.showSuccess('translate_deactivate-user-success');
      } else if (dialog.action === 'delete') {
        await this.userDirectory.deleteUser(dialog.userId);
        this.users.update((current) => current.filter((u) => u.id !== dialog.userId));
        this.notification.showSuccess('translate_delete-user-success');
      }
    } catch {
      // Error already shown via NotificationService
    } finally {
      this.confirmLoading.set(false);
      this.closeConfirmDialog();
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
