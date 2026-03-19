import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormField, email, form, required, submit } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { TranslationService } from '../../core/services/translation.service';

interface LoginModel {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormField, RouterLink, TranslatePipe, PasswordModule, FormsModule],
  host: {
    class: 'flex min-h-screen items-center justify-center px-4 app-bg',
  },
  template: `
    <main class="w-full max-w-md">
      <section class="card-glass p-8">
        <header class="mb-6 text-center">
          <p class="text-sm tracking-[0.25em] uppercase text-muted">
            {{ 'translate_app-name' | translate }}
          </p>
          <h1 class="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {{ 'translate_login-welcome-title' | translate }}
          </h1>
          <p class="mt-1 text-muted">
            {{ 'translate_login-welcome-subtitle' | translate }}
          </p>
        </header>

        <form (submit)="onSubmit($event)" class="space-y-4">
          <div class="space-y-2">
            <label
              for="email"
              class="block text-sm font-medium text-slate-900 dark:text-slate-50"
              >{{ 'translate_email' | translate }}</label
            >
            <input
              id="email"
              type="email"
              [placeholder]="'translate_login-email-placeholder' | translate"
              class="input-glass"
              [formField]="loginForm.email"
              autocomplete="email"
            />
            @if (loginForm.email().touched() && loginForm.email().invalid()) {
              <p class="text-xs text-red-400">
                {{ loginForm.email().errors()[0].message | translate }}
              </p>
            }
          </div>

          <div class="space-y-2">
            <label
              for="password"
              class="block text-sm font-medium text-slate-900 dark:text-slate-50"
              >{{ 'translate_password' | translate }}</label
            >
            <p-password
              id="password"
              [(ngModel)]="model().password"
              name="password"
              [toggleMask]="true"
              [feedback]="false"
              placeholder="••••••••"
              styleClass="w-full"
              autocomplete="current-password"
              meter
              fluid
            />
            @if (passwordError()) {
              <p class="text-xs text-red-400">
                {{ passwordError() }}
              </p>
            }
          </div>

          <button
            type="submit"
            class="btn-primary w-full"
            [disabled]="loading() || !model().password"
          >
            @if (loading()) {
              <span class="inline-flex items-center gap-2">
                <span
                  class="h-3 w-3 animate-spin rounded-full border border-slate-900 dark:border-slate-50 border-t-transparent"
                ></span>
                <span>{{ 'translate_login-submit-loading' | translate }}</span>
              </span>
            } @else {
              <span>{{ 'translate_login-submit-label' | translate }}</span>
            }
          </button>

          <button
            type="button"
            class="btn-ghost w-full"
            (click)="onGoogleSignIn()"
            [disabled]="loading()"
          >
            <span class="inline-flex items-center justify-center gap-2">
              <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white">
                <span
                  class="h-3 w-3 rounded-full bg-gradient-to-tr from-sky-500 via-amber-400 to-red-500"
                ></span>
              </span>
              <span>{{ 'translate_login-google-label' | translate }}</span>
            </span>
          </button>
        </form>

        <div class="mt-4 text-center">
          <a
            routerLink="/forgot-password"
            class="text-xs font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50 underline underline-offset-4 hover:no-underline"
          >
            {{ 'translate_forgot-password-link' | translate }}
          </a>
        </div>

        <footer class="mt-6 text-center">
          <p class="text-muted text-xs">
            {{ 'translate_admin-restricted-body' | translate }}
          </p>
        </footer>
      </section>
    </main>
  `,
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly translation = inject(TranslationService);

  protected readonly model = signal<LoginModel>({
    email: '',
    password: '',
  });

  protected readonly loginForm = form(this.model, (schemaPath) => {
    required(schemaPath.email, {
      message: this.translation.instant('translate_validation-email-required'),
    });
    email(schemaPath.email, {
      message: this.translation.instant('translate_validation-email-invalid'),
    });
    required(schemaPath.password, {
      message: this.translation.instant('translate_validation-password-required'),
    });
  });

  protected readonly loading = signal(false);
  protected readonly passwordError = signal<string | null>(null);
  private readonly notification = inject(NotificationService);

  protected onPasswordBlur(): void {
    const password = this.model().password;
    if (!password) {
      this.passwordError.set(this.translation.instant('translate_validation-password-required'));
    } else {
      this.passwordError.set(null);
    }
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    const emailField = this.loginForm.email();
    const password = this.model().password;

    if (!emailField.value || !password) {
      if (!password) {
        this.passwordError.set(this.translation.instant('translate_validation-password-required'));
      }
      return;
    }

    await submit(this.loginForm, async () => {
      this.loading.set(true);
      try {
        await this.authService.loginWithEmailPassword(this.model());
        await this.router.navigateByUrl('/');
      } catch (err) {
        const message =
          this.authService.mapAuthErrorToMessage(err) ??
          this.translation.instant('translate_login-error-generic');
        this.notification.showError(message);
      } finally {
        this.loading.set(false);
      }
    });
  }

  async onGoogleSignIn(): Promise<void> {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    try {
      await this.authService.loginWithGoogle();
      await this.router.navigateByUrl('/');
    } catch (err) {
      const message =
        this.authService.mapAuthErrorToMessage(err) ??
        this.translation.instant('translate_login-error-google');
      this.notification.showError(message);
    } finally {
      this.loading.set(false);
    }
  }
}
