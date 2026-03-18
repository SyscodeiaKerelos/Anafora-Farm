import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';

import { ThemeService } from '../services/theme.service';
import { TranslationService } from '../services/translation.service';
import { AuthService } from '../services/auth.service';
import { NavbarDropdownController } from './navbar-dropdown.controller';
import { UiMenu, type UiMenuItem } from '../../shared/ui/menu/ui-menu.component';
import { UiConfirmDialog } from '../../shared/ui/dialog/ui-confirm-dialog.component';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, TranslatePipe, NgIcon, UiMenu, UiConfirmDialog],
  providers: [NavbarDropdownController],
  host: {
    class: 'px-2 sm:px-4 pt-2 sm:pt-4',
  },
  template: `
    <div
      class="card-glass mx-auto flex max-w-5xl items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3"
    >
      <div class="flex min-w-0 items-center gap-2">
        <a
          routerLink="/"
          class="text-base font-semibold tracking-[0.25em] uppercase text-muted shrink-0"
        >
          {{ 'Anafora' }}
        </a>
      </div>

      <!-- Desktop nav: visible from md up -->
      <div class="hidden md:flex items-center gap-2 lg:gap-3">
        <app-ui-menu
          menuId="language"
          [labelKey]="'translate_language'"
          icon="faSolidGlobe"
          [items]="languageItems"
          (itemSelected)="onLanguageSelected($event)"
        />
        <app-ui-menu
          menuId="theme"
          [labelKey]="themeService.isDark() ? 'translate_dark-mode' : 'translate_light-mode'"
          [icon]="themeService.isDark() ? 'faSolidMoon' : 'faSolidSun'"
          [items]="themeItems"
          (itemSelected)="onThemeSelected($event)"
        />
        @if (!authService.isAuthenticated()) {
          <button type="button" class="btn-primary" (click)="goToLogin()">
            {{ 'translate_login-submit-label' | translate }}
          </button>
        } @else {
          <a routerLink="/admin/users" class="btn-ghost inline-flex items-center gap-2">
            <ng-icon name="faSolidUsers" size="1rem" />
            {{ 'translate_admin-users-title' | translate }}
          </a>
          <a routerLink="/animals" class="btn-ghost inline-flex items-center gap-2">
            <ng-icon name="faSolidCow" size="1rem" />
            {{ 'translate_animals-title' | translate }}
          </a>
          <a routerLink="/species/add" class="btn-ghost inline-flex items-center gap-2">
            <ng-icon name="faSolidFeather" size="1rem" />
            {{ 'translate_species-add-title' | translate }}
          </a>
          <app-ui-menu
            menuId="user"
            [avatarText]="userInitials()"
            [items]="userMenuItems"
            (itemSelected)="onUserMenuSelected($event)"
          />
        }
      </div>

      <!-- Mobile: burger or login -->
      <div class="flex md:hidden items-center gap-2">
        @if (!authService.isAuthenticated()) {
          <button type="button" class="btn-primary px-3 py-2 text-sm" (click)="goToLogin()">
            {{ 'translate_login-submit-label' | translate }}
          </button>
        } @else {
          <button
            type="button"
            class="btn-ghost inline-flex h-10 w-10 items-center justify-center rounded-2xl"
            (click)="toggleMobileMenu()"
            [attr.aria-expanded]="mobileMenuOpen()"
            aria-label="Menu"
          >
            @if (mobileMenuOpen()) {
              <ng-icon name="faSolidRectangleXmark" size="1.25rem" />
            } @else {
              <ng-icon name="faSolidBars" size="1.25rem" />
            }
          </button>
        }
      </div>
    </div>

    <!-- Mobile menu overlay and panel -->
    @if (mobileMenuOpen()) {
      <div class="fixed inset-0 z-30 md:hidden" role="presentation">
        <button
          type="button"
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          aria-label="Close menu"
          (click)="closeMobileMenu()"
        ></button>
        <nav
          class="absolute end-0 top-0 bottom-0 w-full max-w-xs flex flex-col rounded-s-2xl border border-slate-200/70 border-e-0 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95 ms-auto"
          [attr.aria-label]="'translate_home' | translate"
        >
          <div
            class="flex items-center justify-between px-4 py-3 border-b border-slate-200/50 dark:border-white/10"
          >
            <span class="text-sm font-semibold text-slate-900 dark:text-slate-50">{{
              'translate_home' | translate
            }}</span>
            <button
              type="button"
              class="btn-ghost h-9 w-9 p-0 rounded-xl"
              aria-label="Close menu"
              (click)="closeMobileMenu()"
            >
              <ng-icon name="faSolidRectangleXmark" size="1.125rem" />
            </button>
          </div>
          <div class="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
            <a
              routerLink="/"
              class="btn-ghost justify-start rounded-xl px-4 py-3 text-sm"
              (click)="closeMobileMenu()"
            >
              <ng-icon name="faSolidHouse" size="1rem" class="shrink-0" />
              <span>{{ 'translate_home' | translate }}</span>
            </a>
            <a
              routerLink="/admin/users"
              class="btn-ghost justify-start rounded-xl px-4 py-3 text-sm"
              (click)="closeMobileMenu()"
            >
              <ng-icon name="faSolidUsers" size="1rem" class="shrink-0" />
              <span>{{ 'translate_admin-users-title' | translate }}</span>
            </a>
            <a
              routerLink="/animals"
              class="btn-ghost justify-start rounded-xl px-4 py-3 text-sm"
              (click)="closeMobileMenu()"
            >
              <ng-icon name="faSolidCow" size="1rem" class="shrink-0" />
              <span>{{ 'translate_animals-title' | translate }}</span>
            </a>
            <div class="my-2 h-px bg-slate-200/70 dark:bg-white/10"></div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="w-full px-2 text-xs font-medium text-muted">{{
                'translate_language' | translate
              }}</span>
              <button
                type="button"
                class="btn-ghost rounded-xl px-3 py-2 text-xs"
                (click)="onLanguageSelected('en'); closeMobileMenu()"
              >
                {{ 'translate_english' | translate }}
              </button>
              <button
                type="button"
                class="btn-ghost rounded-xl px-3 py-2 text-xs"
                (click)="onLanguageSelected('ar'); closeMobileMenu()"
              >
                {{ 'translate_arabic' | translate }}
              </button>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="w-full px-2 text-xs font-medium text-muted mt-2"
                >{{ 'translate_light-mode' | translate }} /
                {{ 'translate_dark-mode' | translate }}</span
              >
              <button
                type="button"
                class="btn-ghost rounded-xl px-3 py-2 text-xs"
                (click)="onThemeSelected('light')"
              >
                {{ 'translate_light-mode' | translate }}
              </button>
              <button
                type="button"
                class="btn-ghost rounded-xl px-3 py-2 text-xs"
                (click)="onThemeSelected('dark')"
              >
                {{ 'translate_dark-mode' | translate }}
              </button>
            </div>
          </div>
          <!-- User menu at bottom -->
          <div class="mt-auto border-t border-slate-200/50 dark:border-white/10 p-3">
            <div
              class="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white/40 px-3 py-2.5 dark:border-white/10 dark:bg-slate-800/60"
            >
              <span
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm font-semibold text-slate-900"
              >
                {{ userInitials() }}
              </span>
              <div class="flex min-w-0 flex-1 flex-col gap-1">
                <button
                  type="button"
                  class="btn-ghost justify-start rounded-lg px-2 py-1.5 text-left text-sm"
                  (click)="onUserMenuSelected('profile'); closeMobileMenu()"
                >
                  <ng-icon name="faSolidUser" size="0.875rem" class="shrink-0" />
                  <span>{{ 'translate_profile-view-details' | translate }}</span>
                </button>
                <button
                  type="button"
                  class="btn-ghost justify-start rounded-lg px-2 py-1.5 text-left text-sm"
                  (click)="onUserMenuSelected('sign-out')"
                >
                  <ng-icon name="faSolidArrowRightFromBracket" size="0.875rem" class="shrink-0" />
                  <span>{{ 'translate_logout-label' | translate }}</span>
                </button>
              </div>
            </div>
          </div>
        </nav>
      </div>
    }

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
  protected readonly mobileMenuOpen = signal(false);

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  protected readonly languageItems: UiMenuItem[] = [
    { id: 'en', labelKey: 'translate_english' },
    { id: 'ar', labelKey: 'translate_arabic' },
  ];

  protected readonly themeItems: UiMenuItem[] = [
    { id: 'light', labelKey: 'translate_light-mode', icon: 'faSolidSun' },
    { id: 'dark', labelKey: 'translate_dark-mode', icon: 'faSolidMoon' },
  ];

  protected readonly userMenuItems: UiMenuItem[] = [
    { id: 'profile', labelKey: 'translate_profile-view-details', icon: 'faSolidUser' },
    { id: 'sign-out', labelKey: 'translate_logout-label', icon: 'faSolidArrowRightFromBracket' },
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
      void this.router.navigate(['/profile']);
    } else if (id === 'sign-out') {
      this.closeMobileMenu();
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
