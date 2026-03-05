import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

import {
  collection,
  doc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';

import { AuthService } from '../../core/services/auth.service';
import { Role } from '../../core/types/role';
import { getFirebaseDb } from '../../core/config/firebase.config';
import { TranslationService } from '../../core/services/translation.service';
import {
  UiDataTable,
  type ColumnConfig,
  type FilterConfig,
  type TableRowActionEvent,
} from '../../shared/ui/table/ui-data-table.component';

interface UserRow {
  id: string;
  email: string | null;
  displayName: string | null;
  role: Role;
}

@Component({
  selector: 'app-admin-users-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe, UiDataTable],
  host: {
    class: 'block space-y-6',
  },
  template: `
    @if (!canManage()) {
      <section class="card-glass p-6 text-center">
        <h1 class="text-xl font-semibold text-foreground">
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
            <h1 class="text-xl font-semibold text-foreground">
              {{ 'translate_admin-users-title' | translate }}
            </h1>
            <p class="mt-1 text-muted">
              {{ 'translate_admin-users-subtitle' | translate }}
            </p>
          </div>
          <button
            type="button"
            class="btn-ghost px-4 py-1.5 text-xs"
            (click)="reload()"
          >
            {{ 'translate_admin-users-refresh' | translate }}
          </button>
        </header>

        @if (error()) {
          <p class="text-xs text-red-400">
            {{ error() }}
          </p>
        }

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
  `,
})
export class AdminUsersPage {
  private readonly authService = inject(AuthService);
  private readonly db = getFirebaseDb();
  private readonly translation = inject(TranslationService);

  protected readonly users = signal<UserRow[]>([]);
  protected readonly loading = signal(true);
  protected readonly savingId = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly canManage = computed(() => this.authService.hasAtLeastRole('superAdmin'));

  protected readonly columns: ColumnConfig<UserRow>[] = [
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

  protected readonly filters: FilterConfig<UserRow>[] = [
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

  onRowAction(event: TableRowActionEvent<UserRow>): void {
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
    this.error.set(null);

    try {
      const snapshot = await getDocs(collection(this.db, 'users'));
      const rows: UserRow[] = [];

      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data() as {
          email?: string | null;
          displayName?: string | null;
          role?: Role;
        };

        rows.push({
          id: docSnapshot.id,
          email: data.email ?? null,
          displayName: data.displayName ?? null,
          role: data.role ?? 'user',
        });
      });

      this.users.set(rows);
    } catch {
      this.error.set(this.translation.instant('translate_admin-users-error-load'));
    } finally {
      this.loading.set(false);
    }
  }

  async updateRole(id: string, role: Role): Promise<void> {
    if (!this.canManage()) {
      return;
    }

    this.savingId.set(id);
    this.error.set(null);

    try {
      const ref = doc(collection(this.db, 'users'), id);
      await updateDoc(ref, { role });

      this.users.update((current) =>
        current.map((user) => (user.id === id ? { ...user, role } : user)),
      );
    } catch {
      this.error.set(this.translation.instant('translate_admin-users-error-update'));
    } finally {
      this.savingId.set(null);
    }
  }
}

