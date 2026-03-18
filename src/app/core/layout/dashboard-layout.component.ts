import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';

import { ThemeService } from '../services/theme.service';
import { TranslationService } from '../services/translation.service';
import { AuthService } from '../services/auth.service';
import { NotificationToastComponent } from '../components/notification-toast.component';
import { UiConfirmDialog } from '../../shared/ui/dialog/ui-confirm-dialog.component';

interface NavItem {
  id: string;
  labelKey: string;
  icon: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-dashboard-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
    NgIcon,
    NotificationToastComponent,
    UiConfirmDialog,
  ],
  template: `
    <app-notification-toast />

    <!-- Mobile Header -->
    <header
      class="fixed inset-x-0 top-0 z-40 border-b border-slate-200/70 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95 md:hidden"
    >
      <div class="mx-2 flex h-14 items-center justify-between px-3">
        <a routerLink="/" class="flex items-center gap-2">
          <img
            src="assets/logo anafora black icon pdf-01.svg"
            alt="Anafora"
            class="h-8 w-8 object-contain dark:invert"
          />
          <span class="text-base font-bold tracking-wide text-slate-900 dark:text-white">
            Anafora
          </span>
        </a>
        <div class="flex items-center gap-1">
          <button
            type="button"
            class="btn-ghost h-10 w-10 p-0 rounded-xl"
            (click)="themeService.toggleTheme()"
            [attr.aria-label]="themeService.isDark() ? 'Light mode' : 'Dark mode'"
          >
            <ng-icon
              [name]="themeService.isDark() ? 'faSolidMoon' : 'faSolidSun'"
              size="1rem"
              class="text-slate-700 dark:text-slate-300"
            />
          </button>
          <button
            type="button"
            class="btn-ghost h-10 w-10 p-0 rounded-xl"
            (click)="toggleMobileMenu()"
          >
            <ng-icon
              [name]="mobileMenuOpen() ? 'faSolidXmark' : 'faSolidBars'"
              size="1rem"
              class="text-slate-700 dark:text-slate-300"
            />
          </button>
        </div>
      </div>
    </header>

    <!-- Desktop Sidebar -->
    <aside
      class="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col border-e border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80 md:flex"
    >
      <!-- Logo -->
      <a
        routerLink="/"
        class="flex h-16 items-center gap-3 border-b border-slate-200/70 px-5 dark:border-white/10 hover:opacity-80 transition-opacity"
      >
        <img
          src="assets/logo anafora black icon pdf-01.svg"
          alt="Anafora"
          class="h-10 w-10 object-contain dark:invert"
        />
        <div>
          <span class="text-sm font-bold tracking-wide text-slate-900 dark:text-white"
            >Anafora</span
          >
          <span class="ms-1 text-xs text-muted">Farm</span>
        </div>
      </a>

      <!-- Nav Items -->
      <nav class="flex-1 overflow-y-auto p-4">
        <ul class="space-y-1">
          @for (item of visibleNavItems(); track item.id) {
            <li>
              <a
                [routerLink]="item.route"
                routerLinkActive="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                class="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ng-icon
                  [name]="item.icon"
                  size="1.125rem"
                  class="shrink-0 text-slate-500 dark:text-slate-400"
                />
                <span>{{ item.labelKey | translate }}</span>
              </a>
            </li>
          }
        </ul>
      </nav>

      <!-- User Section -->
      <div class="border-t border-slate-200/70 p-4 dark:border-white/10">
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-semibold text-white"
          >
            {{ userInitials() }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="truncate text-sm font-medium text-slate-900 dark:text-white">
              {{ authService.user()?.displayName || 'User' }}
            </p>
            <p class="truncate text-xs text-muted">
              {{ authService.user()?.email }}
            </p>
          </div>
          <button
            type="button"
            class="btn-ghost h-8 w-8 p-0 rounded-lg"
            (click)="themeService.toggleTheme()"
          >
            <ng-icon
              [name]="themeService.isDark() ? 'faSolidMoon' : 'faSolidSun'"
              size="0.875rem"
            />
          </button>
        </div>
      </div>
    </aside>

    <!-- Mobile Menu Overlay -->
    @if (mobileMenuOpen()) {
      <div class="fixed inset-0 z-50 md:hidden">
        <button
          type="button"
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          (click)="closeMobileMenu()"
        ></button>
        <nav
          class="absolute end-0 top-0 bottom-0 w-72 rounded-s-2xl bg-white/95 backdrop-blur-xl dark:bg-slate-900/95"
        >
          <div
            class="flex h-16 items-center justify-between border-b border-slate-200/70 px-5 dark:border-white/10"
          >
            <span class="text-sm font-bold text-slate-900 dark:text-white">Menu</span>
            <button
              type="button"
              class="btn-ghost h-8 w-8 p-0 rounded-lg"
              (click)="closeMobileMenu()"
            >
              <ng-icon name="faSolidXmark" size="1rem" class="text-slate-700 dark:text-slate-300" />
            </button>
          </div>
          <div class="overflow-y-auto p-4">
            <ul class="space-y-1">
              @for (item of visibleNavItems(); track item.id) {
                <li>
                  <a
                    [routerLink]="item.route"
                    routerLinkActive="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                    class="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    (click)="closeMobileMenu()"
                  >
                    <ng-icon
                      [name]="item.icon"
                      size="1.125rem"
                      class="shrink-0 text-slate-500 dark:text-slate-400"
                    />
                    <span>{{ item.labelKey | translate }}</span>
                  </a>
                </li>
              }
            </ul>

            <div class="mt-6 space-y-4">
              <!-- Language -->
              <div class="rounded-xl bg-slate-100/80 p-3 dark:bg-slate-800/50">
                <p class="mb-2 text-xs font-medium text-muted">
                  {{ 'translate_language' | translate }}
                </p>
                <div class="flex gap-2">
                  <button
                    type="button"
                    class="flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                    [class.btn-primary]="translationService.currentLang() === 'en'"
                    [class.btn-ghost]="translationService.currentLang() !== 'en'"
                    (click)="setLanguage('en')"
                  >
                    {{ 'translate_en' | translate }}
                  </button>
                  <button
                    type="button"
                    class="flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                    [class.btn-primary]="translationService.currentLang() === 'ar'"
                    [class.btn-ghost]="translationService.currentLang() !== 'ar'"
                    (click)="setLanguage('ar')"
                  >
                    {{ 'translate_ar' | translate }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>
    }

    <!-- Main Content -->
    <main class="min-h-screen transition-all md:ms-64">
      <div class="p-4 pt-20 pb-24 md:p-6 md:pt-6 md:pb-10">
        <ng-content />
      </div>
    </main>

    <!-- Mobile Bottom Navigation -->
    <nav
      class="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/70 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95 md:hidden"
    >
      <div class="flex h-16 items-center justify-around px-1">
        @for (item of mobileNavItems(); track item.id) {
          <a
            [routerLink]="item.route"
            routerLinkActive="text-amber-500"
            class="flex h-full min-w-[4rem] flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-slate-500 transition-colors"
            [class.text-amber-500]="isActive(item.route)"
          >
            <ng-icon
              [name]="item.icon"
              size="1.25rem"
              class="text-slate-500 dark:text-slate-400"
              [class.text-amber-500]="isActive(item.route)"
            />
            <span class="truncate max-w-full">{{ item.labelKey | translate }}</span>
          </a>
        }
      </div>
    </nav>

    <!-- Mobile FAB -->
    <button
      type="button"
      class="fixed bottom-20 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/30 transition-transform hover:scale-105 active:scale-95 md:hidden"
      (click)="onFabClick()"
      aria-label="Add animal"
    >
      <ng-icon name="faSolidPlus" size="1.25rem" />
    </button>

    <!-- Sign Out Dialog -->
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
export class DashboardLayoutComponent {
  protected readonly themeService = inject(ThemeService);
  protected readonly translationService = inject(TranslationService);
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly mobileMenuOpen = signal(false);
  protected readonly showSignOutConfirm = signal(false);

  protected readonly navItems: NavItem[] = [
    { id: 'home', labelKey: 'translate_home', icon: 'faSolidHouse', route: '/' },
    { id: 'animals', labelKey: 'translate_animals-title', icon: 'faSolidCow', route: '/animals' },
    {
      id: 'species',
      labelKey: 'translate_species-add-title',
      icon: 'faSolidFeather',
      route: '/species/add',
    },
    {
      id: 'users',
      labelKey: 'translate_admin-users-title',
      icon: 'faSolidUsers',
      route: '/admin/users',
      roles: ['admin', 'superAdmin'],
    },
  ];

  protected readonly visibleNavItems = computed(() => {
    const role = this.authService.role() ?? 'user';
    return this.navItems.filter((item) => {
      if (!item.roles) return true;
      return item.roles.includes(role);
    });
  });

  protected readonly mobileNavItems = computed(() => {
    return this.navItems.slice(0, 4);
  });

  protected readonly userInitials = computed(() => {
    const user = this.authService.user();
    const source = user?.displayName || user?.email || '';
    if (!source) return '?';
    return source.charAt(0).toUpperCase();
  });

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  protected setLanguage(lang: string): void {
    if (lang === 'en' || lang === 'ar') {
      this.translationService.setLanguage(lang);
    }
  }

  protected isActive(route: string): boolean {
    return this.router.url === route;
  }

  protected onFabClick(): void {
    this.router.navigate(['/animals']);
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
