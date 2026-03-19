import { ChangeDetectionStrategy, Component, inject, signal, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslationService } from '../../../core/services/translation.service';

interface ForgotPasswordModel {
  email: string;
}

@Component({
  selector: 'app-forgot-password-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
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
            {{ 'translate_forgot-password-title' | translate }}
          </h1>
          <p class="mt-1 text-muted text-sm">
            {{ 'translate_forgot-password-subtitle' | translate }}
          </p>
        </header>

        @if (success()) {
          <div
            class="rounded-xl bg-emerald-500/10 p-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <div class="mb-2 flex justify-center">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20"
              >
                <svg
                  class="h-6 w-6 text-emerald-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <p class="text-sm text-emerald-600 dark:text-emerald-400">
              {{ 'translate_forgot-password-success' | translate }}
            </p>
            <p class="mt-1 text-xs text-muted">
              {{ 'translate_forgot-password-success-hint' | translate }}
            </p>
            @if (resendCountdown() > 0) {
              <p class="mt-3 text-xs text-muted">
                {{
                  'translate_forgot-password-resend-hint'
                    | translate: { seconds: resendCountdown() }
                }}
              </p>
            } @else {
              <button
                type="button"
                class="btn-ghost mt-3 text-xs"
                (click)="resendResetEmail()"
                [disabled]="resendLoading()"
              >
                @if (resendLoading()) {
                  <span class="inline-flex items-center gap-1">
                    <span
                      class="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent"
                    ></span>
                  </span>
                } @else {
                  {{ 'translate_forgot-password-resend' | translate }}
                }
              </button>
            }
          </div>
        } @else {
          <form (submit)="onSubmit($event)" class="space-y-4">
            <div class="space-y-2">
              <label
                for="email"
                class="block text-sm font-medium text-slate-900 dark:text-slate-50"
              >
                {{ 'translate_email' | translate }}
              </label>
              <input
                id="email"
                type="email"
                [placeholder]="'translate_login-email-placeholder' | translate"
                class="input-glass w-full"
                autocomplete="email"
                [ngModel]="model().email"
                (ngModelChange)="model.update(m => ({ ...m, email: $event }))"
              />
            </div>

            @if (errorMessage()) {
              <div
                class="rounded-xl bg-red-500/10 p-3 text-xs text-red-400 animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                {{ errorMessage() }}
              </div>
            }

            <button type="submit" class="btn-primary w-full" [disabled]="loading()">
              @if (loading()) {
                <span class="inline-flex items-center gap-2">
                  <span
                    class="h-3 w-3 animate-spin rounded-full border border-slate-900 dark:border-slate-50 border-t-transparent"
                  ></span>
                  <span>{{ 'translate_forgot-password-sending' | translate }}</span>
                </span>
              } @else {
                <span>{{ 'translate_forgot-password-submit' | translate }}</span>
              }
            </button>

            <div class="text-center">
              <a
                routerLink="/login"
                class="inline-flex items-center gap-1 text-xs font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
              >
                <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                {{ 'translate_back-to-login' | translate }}
              </a>
            </div>
          </form>
        }
      </section>
    </main>
  `,
  styles: `
    @keyframes fade-in {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes slide-in-from-bottom-4 {
      from {
        transform: translateY(1rem);
      }
      to {
        transform: translateY(0);
      }
    }

    @keyframes slide-in-from-top-1 {
      from {
        transform: translateY(-0.25rem);
      }
      to {
        transform: translateY(0);
      }
    }

    @keyframes slide-in-from-bottom-2 {
      from {
        transform: translateY(0.5rem);
      }
      to {
        transform: translateY(0);
      }
    }

    .animate-in {
      animation-fill-mode: both;
    }

    .fade-in {
      animation-name: fade-in;
    }

    .slide-in-from-bottom-4 {
      animation-name: slide-in-from-bottom-4;
    }

    .slide-in-from-top-1 {
      animation-name: slide-in-from-top-1;
    }

    .slide-in-from-bottom-2 {
      animation-name: slide-in-from-bottom-2;
    }

    .duration-500 {
      animation-duration: 500ms;
    }

    .duration-300 {
      animation-duration: 300ms;
    }

    .duration-200 {
      animation-duration: 200ms;
    }
  `,
})
export class ForgotPasswordPage implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly translation = inject(TranslationService);
  private readonly notification = inject(NotificationService);
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  protected readonly model = signal<ForgotPasswordModel>({
    email: '',
  });

  protected readonly loading = signal(false);
  protected readonly resendLoading = signal(false);
  protected readonly success = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly resendCountdown = signal(0);

  ngOnDestroy(): void {
    this.clearCountdown();
  }

  private startCountdown(seconds: number = 60): void {
    this.clearCountdown();
    this.resendCountdown.set(seconds);
    this.countdownInterval = setInterval(() => {
      this.resendCountdown.update((n) => {
        if (n <= 1) {
          this.clearCountdown();
          return 0;
        }
        return n - 1;
      });
    }, 1000);
  }

  private clearCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.errorMessage.set(null);

    const emailValue = this.model().email.trim();
    if (!emailValue) {
      this.errorMessage.set(this.translation.instant('translate_validation-email-required'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      this.errorMessage.set(this.translation.instant('translate_validation-email-invalid'));
      return;
    }

    this.loading.set(true);
    try {
      await this.authService.resetPassword(emailValue.toLowerCase());
      this.success.set(true);
      this.startCountdown(60);
    } catch (err) {
      const message =
        this.authService.mapResetPasswordErrorToMessage(err) ??
        this.translation.instant('translate_forgot-password-error-generic');
      this.errorMessage.set(message);
    } finally {
      this.loading.set(false);
    }
  }

  async resendResetEmail(): Promise<void> {
    if (this.resendLoading() || this.resendCountdown() > 0) {
      return;
    }

    const emailValue = this.model().email.trim();
    if (!emailValue) {
      return;
    }

    this.resendLoading.set(true);
    try {
      await this.authService.resetPassword(emailValue.toLowerCase());
      this.startCountdown(60);
      this.notification.showSuccess(
        this.translation.instant('translate_forgot-password-resend-success'),
      );
    } catch (err) {
      const message =
        this.authService.mapResetPasswordErrorToMessage(err) ??
        this.translation.instant('translate_forgot-password-error-generic');
      this.notification.showError(message);
    } finally {
      this.resendLoading.set(false);
    }
  }
}
