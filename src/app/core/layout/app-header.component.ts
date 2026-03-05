import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { ThemeService } from '../services/theme.service';
import { TranslationService } from '../services/translation.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, TranslatePipe],
  host: {
    class: 'px-4 pt-4',
  },
  template: `
    <div
      class="card-glass mx-auto flex max-w-5xl items-center justify-between px-4 py-3"
    >
      <div class="flex items-center gap-2">
        <span class="text-base font-semibold tracking-[0.25em] uppercase text-muted">
          Anafora
        </span>
        <h1 class="text-lg font-semibold text-slate-50">
          {{ title() }}
        </h1>
      </div>

      <div class="flex items-center gap-3">
        <!-- Language Switcher -->
        <div class="flex gap-2">
          <button
            type="button"
            class="btn-ghost px-3 py-1 text-xs"
            [class.bg-amber-400]="translationService.currentLang() === 'en'"
            [class.text-slate-900]="translationService.currentLang() === 'en'"
            (click)="translationService.setLanguage('en')"
          >
            {{ 'translate_en' | translate }}
          </button>
          <button
            type="button"
            class="btn-ghost px-3 py-1 text-xs"
            [class.bg-amber-400]="translationService.currentLang() === 'ar'"
            [class.text-slate-900]="translationService.currentLang() === 'ar'"
            (click)="translationService.setLanguage('ar')"
          >
            {{ 'translate_ar' | translate }}
          </button>
        </div>

        <!-- Theme Toggle -->
        <button
          type="button"
          class="btn-ghost px-3 py-1 text-xs"
          (click)="themeService.toggleTheme()"
          [attr.aria-label]="
            themeService.isDark()
              ? ('translate_light-mode' | translate)
              : ('translate_dark-mode' | translate)
          "
        >
          <span class="inline-flex items-center gap-2">
            <i
              class="pi"
              [class.pi-moon]="!themeService.isDark()"
              [class.pi-sun]="themeService.isDark()"
            ></i>
            <span>
              {{
                themeService.isDark()
                  ? ('translate_dark-mode' | translate)
                  : ('translate_light-mode' | translate)
              }}
            </span>
          </span>
        </button>

        @if (!authService.isAuthenticated()) {
          <button
            type="button"
            class="btn-primary px-4 py-1.5 text-xs"
            (click)="goToLogin()"
          >
            {{ 'translate_login-submit-label' | translate }}
          </button>
        } @else {
          <a
            routerLink="/"
            class="btn-ghost px-4 py-1.5 text-xs"
          >
            {{ 'translate_home' | translate }}
          </a>
          <a
            routerLink="/admin/users"
            class="btn-ghost px-4 py-1.5 text-xs"
          >
            {{ 'translate_admin-users-title' | translate }}
          </a>
          <button
            type="button"
            class="btn-primary px-4 py-1.5 text-xs"
            (click)="logout()"
          >
            {{ 'translate_logout-label' | translate }}
          </button>
        }
      </div>
    </div>
  `,
})
export class AppHeaderComponent {
  title = input.required<string>();

  protected readonly themeService = inject(ThemeService);
  protected readonly translationService = inject(TranslationService);
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  async goToLogin(): Promise<void> {
    await this.router.navigate(['/login']);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigate(['/login']);
  }
}

