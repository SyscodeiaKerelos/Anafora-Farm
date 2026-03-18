import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { ThemeService } from '../../core/services/theme.service';
import { TranslationService } from '../../core/services/translation.service';
import { AuthService } from '../../core/services/auth.service';
import { Role } from '../../core/types/role';
import { UiBadge } from '../../shared/ui/badge/ui-badge.component';
import { NgIcon } from '@ng-icons/core';

type DashboardCardId = 'fields' | 'tasks' | 'livestock' | 'inventory' | 'reports';

interface DashboardCard {
  id: DashboardCardId;
  titleKey: string;
  subtitleKey: string;
  ctaKey: string;
  icon: string;
  color: string;
  rolesAllowed: Role[];
  route?: string;
}

interface WorkerTask {
  id: number;
  titleKey: string;
  fieldLabel: string;
  timeLabel: string;
  statusKey: string;
}

interface ManagerKpi {
  id: string;
  labelKey: string;
  value: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, TranslatePipe, UiBadge, NgIcon],
  host: {
    class: 'block space-y-4 sm:space-y-6',
  },
  template: `
    <!-- Quick Stats for Mobile -->
    <section class="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:hidden">
      @for (kpi of managerKpis; track kpi.id) {
        <div class="card-glass p-3 text-center">
          <div
            class="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg"
            [class]="kpi.color"
          >
            <ng-icon [name]="kpi.icon" size="1rem" class="text-white" />
          </div>
          <p class="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
            {{ kpi.value }}
          </p>
          <p class="truncate text-[10px] text-muted sm:text-xs">{{ kpi.labelKey | translate }}</p>
        </div>
      }
    </section>

    <!-- Welcome Banner -->
    <section class="card-glass p-4 sm:p-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-medium uppercase tracking-wider text-amber-500">
            {{ 'translate_app-name' | translate }}
          </p>
          <h1 class="mt-1 text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
            {{ 'translate_dashboard_welcome' | translate }}
            @if (authService.user()) {
              <span class="text-muted"
                >, {{ authService.user()?.displayName || authService.user()?.email }}</span
              >
            }
          </h1>
          <p class="mt-1 text-xs text-muted sm:text-sm">
            {{ 'translate_dashboard_farm-context' | translate }}
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <app-ui-badge tone="emerald" [labelKey]="getRoleLabel()" />
          <app-ui-badge tone="sky">
            <ng-icon name="faSolidCircle" size="0.5rem" class="me-1" />
            {{
              themeService.isDark()
                ? ('translate_dark' | translate)
                : ('translate_light' | translate)
            }}
          </app-ui-badge>
        </div>
      </div>
    </section>

    <!-- Dashboard Cards Grid -->
    <section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      @for (card of visibleCards(); track card.id) {
        <a
          [routerLink]="card.route || '/'"
          class="card-glass group relative overflow-hidden p-4 transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <div class="absolute inset-0 bg-gradient-to-br" [class]="card.color"></div>
          <div class="relative flex items-start justify-between">
            <div class="space-y-1">
              <h3 class="text-sm font-semibold text-slate-900 dark:text-white">
                {{ card.titleKey | translate }}
              </h3>
              <p class="text-xs text-slate-600 dark:text-slate-400">
                {{ card.subtitleKey | translate }}
              </p>
            </div>
            <div
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm"
            >
              <ng-icon [name]="card.icon" size="1.25rem" class="text-white" />
            </div>
          </div>
          <div class="relative mt-4">
            <span class="inline-flex items-center text-xs font-medium text-white/90">
              {{ card.ctaKey | translate }}
              <ng-icon
                name="faSolidArrowRight"
                size="0.75rem"
                class="ms-1 transition-transform group-hover:translate-x-1"
              />
            </span>
          </div>
        </a>
      }
    </section>

    <!-- Today's Tasks -->
    <section class="card-glass p-4">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-sm font-semibold text-slate-900 dark:text-white">
          {{ 'translate_dashboard_section-today-schedule' | translate }}
        </h3>
        <button type="button" class="btn-ghost px-2 py-1 text-xs">
          {{ 'translate_dashboard_go-to-tasks' | translate }}
        </button>
      </div>

      @if (workerTasks.length) {
        <div class="space-y-2">
          @for (task of workerTasks; track task.id) {
            <div
              class="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50"
            >
              <div class="flex items-center gap-3">
                <div
                  class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                >
                  <ng-icon name="faSolidClock" size="0.875rem" />
                </div>
                <div>
                  <p class="text-sm font-medium text-slate-900 dark:text-white">
                    {{ task.titleKey | translate }}
                  </p>
                  <p class="text-[11px] text-muted">{{ task.fieldLabel }} • {{ task.timeLabel }}</p>
                </div>
              </div>
              <app-ui-badge tone="emerald" [labelKey]="task.statusKey" />
            </div>
          }
        </div>
      } @else {
        <p class="text-xs text-muted">
          {{ 'translate_dashboard_no-tasks' | translate }}
        </p>
      }
    </section>

    <!-- Desktop KPIs (hidden on mobile, shown in grid above) -->
    <section class="hidden lg:block">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-sm font-semibold text-slate-900 dark:text-white">
          {{ 'translate_dashboard_section-manager-overview' | translate }}
        </h3>
      </div>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        @for (kpi of managerKpis; track kpi.id) {
          <div class="card-glass p-4">
            <div class="flex items-center gap-3">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-xl"
                [class]="kpi.color"
              >
                <ng-icon [name]="kpi.icon" size="1.5rem" class="text-white" />
              </div>
              <div>
                <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ kpi.value }}</p>
                <p class="text-xs text-muted">{{ kpi.labelKey | translate }}</p>
              </div>
            </div>
          </div>
        }
      </div>
    </section>

    <!-- Demo note -->
    <section class="text-center">
      <p class="text-xs text-muted">
        {{ 'translate_dashboard_demo-note' | translate }}
      </p>
    </section>
  `,
})
export class HomePage {
  protected readonly themeService = inject(ThemeService);
  protected readonly translationService = inject(TranslationService);
  protected readonly authService = inject(AuthService);

  protected readonly dashboardCards: DashboardCard[] = [
    {
      id: 'fields',
      titleKey: 'translate_dashboard_card-fields-title',
      subtitleKey: 'translate_dashboard_card-fields-subtitle',
      ctaKey: 'translate_dashboard_card-fields-cta',
      icon: 'faSolidLeaf',
      color: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
      rolesAllowed: ['user', 'admin', 'superAdmin'],
      route: '/',
    },
    {
      id: 'tasks',
      titleKey: 'translate_dashboard_card-tasks-title',
      subtitleKey: 'translate_dashboard_card-tasks-subtitle',
      ctaKey: 'translate_dashboard_card-tasks-cta',
      icon: 'faSolidListCheck',
      color: 'bg-gradient-to-br from-blue-500 to-blue-700',
      rolesAllowed: ['user', 'admin', 'superAdmin'],
      route: '/',
    },
    {
      id: 'livestock',
      titleKey: 'translate_dashboard_card-livestock-title',
      subtitleKey: 'translate_dashboard_card-livestock-subtitle',
      ctaKey: 'translate_dashboard_card-livestock-cta',
      icon: 'faSolidCow',
      color: 'bg-gradient-to-br from-amber-500 to-amber-700',
      rolesAllowed: ['user', 'admin', 'superAdmin'],
      route: '/animals',
    },
    {
      id: 'inventory',
      titleKey: 'translate_dashboard_card-inventory-title',
      subtitleKey: 'translate_dashboard_card-inventory-subtitle',
      ctaKey: 'translate_dashboard_card-inventory-cta',
      icon: 'faSolidBoxesPacking',
      color: 'bg-gradient-to-br from-purple-500 to-purple-700',
      rolesAllowed: ['admin', 'superAdmin'],
      route: '/',
    },
    {
      id: 'reports',
      titleKey: 'translate_dashboard_card-reports-title',
      subtitleKey: 'translate_dashboard_card-reports-subtitle',
      ctaKey: 'translate_dashboard_card-reports-cta',
      icon: 'faSolidChartBar',
      color: 'bg-gradient-to-br from-rose-500 to-rose-700',
      rolesAllowed: ['admin', 'superAdmin'],
      route: '/',
    },
  ];

  protected readonly workerTasks: WorkerTask[] = [
    {
      id: 1,
      titleKey: 'translate_dashboard_task-irrigation',
      fieldLabel: 'Field A • North',
      timeLabel: '06:30',
      statusKey: 'translate_dashboard_status-pending',
    },
    {
      id: 2,
      titleKey: 'translate_dashboard_task-feeding',
      fieldLabel: 'Dairy barn',
      timeLabel: '09:00',
      statusKey: 'translate_dashboard_status-in-progress',
    },
    {
      id: 3,
      titleKey: 'translate_dashboard_task-harvest',
      fieldLabel: 'Olive grove',
      timeLabel: '16:00',
      statusKey: 'translate_dashboard_status-scheduled',
    },
  ];

  protected readonly managerKpis: ManagerKpi[] = [
    {
      id: 'fields',
      labelKey: 'translate_dashboard_kpi-active-fields',
      value: '24',
      icon: 'faSolidLeaf',
      color: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
    },
    {
      id: 'livestock',
      labelKey: 'translate_dashboard_kpi-livestock-headcount',
      value: '128',
      icon: 'faSolidCow',
      color: 'bg-gradient-to-br from-amber-400 to-amber-600',
    },
    {
      id: 'tasks',
      labelKey: 'translate_dashboard_kpi-overdue-tasks',
      value: '3',
      icon: 'faSolidTriangleExclamation',
      color: 'bg-gradient-to-br from-red-400 to-red-600',
    },
    {
      id: 'inventory',
      labelKey: 'translate_dashboard_kpi-low-inventory-items',
      value: '5',
      icon: 'faSolidBoxOpen',
      color: 'bg-gradient-to-br from-purple-400 to-purple-600',
    },
  ];

  protected readonly visibleCards = computed(() => {
    const role = this.authService.role() ?? 'user';
    return this.dashboardCards.filter((card) => card.rolesAllowed.includes(role));
  });

  protected getRoleLabel(): string {
    const role = this.authService.role();
    if (role === 'superAdmin') return 'translate_role-super-admin-label';
    if (role === 'admin') return 'translate_role-admin-label';
    return 'translate_role-user-label';
  }
}
