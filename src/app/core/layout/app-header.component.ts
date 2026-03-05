import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { ThemeService } from '../services/theme.service';
import { TranslationService } from '../services/translation.service';
import { AuthService } from '../services/auth.service';
import { NavbarDropdownController } from './navbar-dropdown.controller';
import { UiMenu, type UiMenuItem } from '../../shared/ui/menu/ui-menu.component';
import { UiConfirmDialog } from '../../shared/ui/dialog/ui-confirm-dialog.component';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, TranslatePipe, UiMenu, UiConfirmDialog],
  providers: [NavbarDropdownController],
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
        <h1 class="text-lg font-semibold text-slate-900 dark:text-slate-50">
          {{ title() }}
        </h1>
      </div>

      <div class="flex items-center gap-3">
        <!-- Language Dropdown -->
        <app-ui-menu
          menuId="language"
          [labelKey]="'translate_language'"
          icon="pi pi-globe"
          [items]="languageItems"
          (itemSelected)="onLanguageSelected($event)"
        />

        <!-- Theme Dropdown -->
        <app-ui-menu
          menuId="theme"
          [labelKey]="themeService.isDark() ? 'translate_dark-mode' : 'translate_light-mode'"
          [icon]="themeService.isDark() ? 'pi pi-moon' : 'pi pi-sun'"
          [items]="themeItems"
          (itemSelected)="onThemeSelected($event)"
        />

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
          <app-ui-menu
            menuId="user"
            [avatarText]="userInitials()"
            [items]="userMenuItems"
            (itemSelected)="onUserMenuSelected($event)"
          />
        }
      </div>
    </div>

    <app-ui-confirm-dialog
      [open]="showSignOutConfirm()"
      titleKey="translate_confirm-signout-title"
      messageKey="translate_confirm-signout-message"
      confirmLabelKey="translate_logout-label"
      (confirmed)="confirmSignOut()"
      (cancelled)="cancelSignOut()"
    />
  `,
})
export class AppHeaderComponent {
  title = input.required<string>();

  protected readonly themeService = inject(ThemeService);
  protected readonly translationService = inject(TranslationService);
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly showSignOutConfirm = signal(false);

  protected readonly languageItems: UiMenuItem[] = [
    { id: 'en', labelKey: 'translate_english' },
    { id: 'ar', labelKey: 'translate_arabic' },
  ];

  protected readonly themeItems: UiMenuItem[] = [
    { id: 'light', labelKey: 'translate_light-mode', icon: 'pi pi-sun' },
    { id: 'dark', labelKey: 'translate_dark-mode', icon: 'pi pi-moon' },
  ];

  protected readonly userMenuItems: UiMenuItem[] = [
    { id: 'profile', labelKey: 'translate_profile-view-details', icon: 'pi pi-user' },
    { id: 'sign-out', labelKey: 'translate_logout-label', icon: 'pi pi-sign-out' },
  ];

  protected readonly userInitials = computed(() => {
    const user = this.authService.user();
    const source = user?.displayName || user?.email || '';
    if (!source) {
      return '?';
    }

    const [firstWord] = source.split(' ');
    const firstChar = firstWord.charAt(0).toUpperCase();
    return firstChar || '?';
  });

  async goToLogin(): Promise<void> {
    await this.router.navigate(['/login']);
  }

  protected onLanguageSelected(id: string): void {
    if (id === 'en' || id === 'ar') {
      this.translationService.setLanguage(id);
    }
  }

  protected onThemeSelected(id: string): void {
    if (id === 'light' || id === 'dark') {
      this.themeService.setTheme(id);
    }
  }

  protected onUserMenuSelected(id: string): void {
    if (id === 'profile') {
      // Placeholder navigation for future profile page.
      void this.router.navigate(['/profile']);
    } else if (id === 'sign-out') {
      this.showSignOutConfirm.set(true);
    }
  }

  protected confirmSignOut(): void {
    this.showSignOutConfirm.set(false);
    void this.logout();
  }

  protected cancelSignOut(): void {
    this.showSignOutConfirm.set(false);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigate(['/login']);
  }
}

