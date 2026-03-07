import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormField,
  form,
  required,
  email,
  submit,
} from '@angular/forms/signals';
import { TranslatePipe } from '@ngx-translate/core';

import { AdminUser } from '../../core/types/admin-user';
import { Role } from '../../core/types/role';
import { TranslationService } from '../../core/services/translation.service';
import { UserDirectoryService } from '../../core/services/user-directory.service';
import { UiButton } from '../../shared/ui/button/ui-button.component';

const ROLES: { value: Role; labelKey: string; capabilitiesKey: string }[] = [
  { value: 'superAdmin', labelKey: 'translate_role-super-admin-label', capabilitiesKey: 'translate_role-super-admin-capabilities' },
  { value: 'admin', labelKey: 'translate_role-admin-label', capabilitiesKey: 'translate_role-admin-capabilities' },
  { value: 'user', labelKey: 'translate_role-user-label', capabilitiesKey: 'translate_role-user-capabilities' },
];

interface AddUserModel {
  email: string;
  password: string;
  displayName: string;
  role: Role;
}

@Component({
  selector: 'app-add-user-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormField, TranslatePipe, UiButton],
  template: `
    @if (open() === true) {
      <div
        class="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-user-dialog-title"
        (click)="onBackdropClick($event)"
        (keydown.escape)="onEscape()"
      >
        <div
          class="card-glass max-w-md w-full rounded-2xl px-5 py-4 text-xs shadow-2xl"
          (click)="$event.stopPropagation()"
        >
          <h2
            id="add-user-dialog-title"
            class="text-sm font-semibold text-slate-900 dark:text-slate-50"
          >
            {{ 'translate_admin-users-dialog-title' | translate }}
          </h2>

          <form (submit)="onSubmit($event)" class="mt-4 space-y-3">
            <div class="space-y-1">
              <label
                for="add-user-email"
                class="block text-[11px] font-semibold text-slate-900 dark:text-slate-50"
              >
                {{ 'translate_email' | translate }}
                <span class="text-red-400">*</span>
              </label>
              <input
                id="add-user-email"
                type="email"
                class="input-glass w-full text-xs"
                [attr.placeholder]="'translate_login-email-placeholder' | translate"
                [formField]="addUserForm.email"
                autocomplete="email"
              />
              @if (addUserForm.email().touched() && addUserForm.email().invalid()) {
                <p class="mt-0.5 text-[11px] text-red-400">
                  {{ addUserForm.email().errors()[0]?.message | translate }}
                </p>
              }
            </div>

            <div class="space-y-1">
              <label
                for="add-user-password"
                class="block text-[11px] font-semibold text-slate-900 dark:text-slate-50"
              >
                {{ 'translate_password' | translate }}
                <span class="text-red-400">*</span>
              </label>
              <input
                id="add-user-password"
                type="password"
                class="input-glass w-full text-xs"
                [attr.placeholder]="'translate_admin-users-dialog-password-placeholder' | translate"
                [formField]="addUserForm.password"
                autocomplete="new-password"
              />
              @if (addUserForm.password().touched() && addUserForm.password().invalid()) {
                <p class="mt-0.5 text-[11px] text-red-400">
                  {{ addUserForm.password().errors()[0]?.message | translate }}
                </p>
              }
            </div>

            <div class="space-y-1">
              <label
                for="add-user-displayName"
                class="block text-[11px] font-semibold text-slate-900 dark:text-slate-50"
              >
                {{ 'translate_admin-users-dialog-display-name-label' | translate }}
              </label>
              <input
                id="add-user-displayName"
                type="text"
                class="input-glass w-full text-xs"
                [attr.placeholder]="'translate_admin-users-dialog-display-name-placeholder' | translate"
                [formField]="addUserForm.displayName"
                autocomplete="name"
              />
            </div>

            <div class="space-y-1">
              <label
                for="add-user-role"
                class="block text-[11px] font-semibold text-slate-900 dark:text-slate-50"
              >
                {{ 'translate_role' | translate }}
                <span class="text-red-400">*</span>
              </label>
              <select
                id="add-user-role"
                class="input-glass w-full text-xs"
                [formField]="addUserForm.role"
              >
                <option value="">
                  {{ 'translate_admin-users-dialog-role-placeholder' | translate }}
                </option>
                @for (r of roleOptions; track r.value) {
                  <option [value]="r.value">{{ r.labelKey | translate }}</option>
                }
              </select>
              @if (addUserForm.role().touched() && addUserForm.role().invalid()) {
                <p class="mt-0.5 text-[11px] text-red-400">
                  {{ addUserForm.role().errors()[0]?.message | translate }}
                </p>
              }
              <p class="mt-1.5 text-[11px] text-muted">
                {{ selectedRoleCapabilitiesKey() | translate }}
              </p>
            </div>

            @if (formError()) {
              <p class="rounded-xl bg-red-500/10 px-3 py-2 text-[11px] text-red-400">
                {{ formError() }}
              </p>
            }

            <div class="mt-4 flex justify-end gap-2">
              <app-ui-button
                variant="ghost"
                size="sm"
                labelKey="translate_cancel"
                [disabled]="submitting()"
                (click)="onCancel()"
              />
              <button
                type="submit"
                class="btn-primary inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs"
                [disabled]="addUserForm().invalid() || submitting()"
              >
                @if (submitting()) {
                  <span class="inline-flex items-center gap-2">
                    <span class="h-3 w-3 animate-spin rounded-full border border-slate-900 dark:border-slate-50 border-t-transparent"></span>
                    <span>{{ 'translate_admin-users-dialog-create' | translate }}</span>
                  </span>
                } @else {
                  <span>{{ 'translate_admin-users-dialog-create' | translate }}</span>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class AddUserDialogComponent {
  readonly open = input(false);
  readonly created = output<AdminUser>();
  readonly closed = output<void>();

  protected readonly roleOptions = ROLES;
  protected readonly model = signal<AddUserModel>({
    email: '',
    password: '',
    displayName: '',
    role: 'user',
  });

  private readonly translation = inject(TranslationService);
  private readonly userDirectory = inject(UserDirectoryService);

  protected readonly addUserForm = form(this.model, (schemaPath) => {
    required(schemaPath.email, {
      message: this.translation.instant('translate_validation-email-required'),
    });
    email(schemaPath.email, {
      message: this.translation.instant('translate_validation-email-invalid'),
    });
    required(schemaPath.password, {
      message: this.translation.instant('translate_validation-password-required'),
    });
    required(schemaPath.role, {
      message: this.translation.instant('translate_validation-role-required'),
    });
  });

  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly selectedRoleCapabilitiesKey = () => {
    const role = this.model().role;
    const option = ROLES.find((r) => r.value === role);
    return option?.capabilitiesKey ?? 'translate_role-user-capabilities';
  };

  protected onEscape(): void {
    if (this.open() && !this.submitting()) {
      this.closed.emit();
    }
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget && !this.submitting()) {
      this.closed.emit();
    }
  }

  protected onCancel(): void {
    if (!this.submitting()) {
      this.closed.emit();
    }
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.formError.set(null);

    await submit(this.addUserForm, async () => {
      this.submitting.set(true);
      try {
        const { email, password, displayName, role } = this.model();
        const createdUser = await this.userDirectory.createUser({
          email,
          password: password || undefined,
          displayName: displayName.trim() || undefined,
          role,
        });
        this.created.emit(createdUser);
        this.resetForm();
      } catch (err) {
        console.error('Create user failed:', err);
        // Error already shown via NotificationService in UserDirectoryService
      } finally {
        this.submitting.set(false);
      }
    });
  }

  private resetForm(): void {
    this.model.set({
      email: '',
      password: '',
      displayName: '',
      role: 'user',
    });
  }
}
